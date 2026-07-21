import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, repoUrl } = await request.json();

    if (!userId || !repoUrl) {
      return NextResponse.json(
        { success: false, error: 'userId dan repoUrl harus diisi.' },
        { status: 400 }
      );
    }

    // Parse owner and repo name from GitHub URL
    // Format supported: https://github.com/owner/repo or owner/repo
    let owner = '';
    let repo = '';

    if (repoUrl.includes('github.com/')) {
      const parts = repoUrl.split('github.com/')[1].split('/');
      owner = parts[0];
      repo = parts[1]?.replace('.git', '');
    } else if (repoUrl.includes('/')) {
      const parts = repoUrl.split('/');
      owner = parts[0];
      repo = parts[1];
    }

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Format URL repositori GitHub tidak valid.' },
        { status: 400 }
      );
    }

    // Retrieve user access token from Supabase using server role client
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from('github_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    // Fallback Mock Mode: if token is not found or client ID is missing
    if (tokenError || !tokenData?.access_token || !process.env.GITHUB_CLIENT_ID) {
      console.log(`[Webhook Mock Mode] Menirukan registrasi webhook ke repository: ${owner}/${repo}`);
      return NextResponse.json({
        success: true,
        isMock: true,
        message: `[Mockup] Webhook berhasil terdaftar secara virtual untuk repositori ${owner}/${repo}.`,
        details: 'Mode mockup diaktifkan karena token GitHub atau client credentials belum tersedia.'
      });
    }

    const accessToken = tokenData.access_token;
    const octokit = new Octokit({ auth: accessToken });

    // Construct Webhook URL
    // Use WEBHOOK_URL environment variable if set (useful for ngrok tunnels), otherwise fallback to standard domain
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const webhookUrl = process.env.WEBHOOK_URL || `${protocol}://${host}/api/webhook/github`;

    console.log(`[Webhook Register] Mendaftarkan webhook ${webhookUrl} ke ${owner}/${repo}`);

    try {
      // Register webhook via Octokit
      await octokit.rest.repos.createWebhook({
        owner,
        repo,
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          insecure_ssl: '1' // Disable SSL verification for development tunnels if needed
        }
      });
    } catch (hookError: any) {
      // Ignore if hook already exists
      if (hookError.status === 422 || hookError.message?.includes('Hook already exists')) {
        console.log(`[Webhook Register] Webhook sudah terdaftar di ${owner}/${repo}.`);
      } else {
        throw hookError;
      }
    }

    return NextResponse.json({
      success: true,
      isMock: false,
      message: `Webhook berhasil didaftarkan ke GitHub untuk repositori ${owner}/${repo}!`,
      webhookUrl
    });

  } catch (err: any) {
    console.error('Error registering GitHub webhook:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal meregistrasi webhook di GitHub.' },
      { status: 500 }
    );
  }
}
