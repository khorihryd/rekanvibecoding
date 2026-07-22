import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, repoUrl } = await request.json();

    if (!userId || !repoUrl) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId dan repoUrl wajib diisi.' },
        { status: 400 }
      );
    }

    // Parse owner and repo name from GitHub URL
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

    // Read AGENTS.md template for target repo from templates folder
    let agentsContent = '';
    try {
      const agentsPath = path.join(process.cwd(), 'src', 'lib', 'templates', 'agents-target-repo.md');
      agentsContent = fs.readFileSync(agentsPath, 'utf8');
    } catch (fsErr: any) {
      console.error('Error reading agents-target-repo.md from disk:', fsErr);
      return NextResponse.json(
        { success: false, error: `Gagal membaca template agents-target-repo.md dari disk server: ${fsErr.message}` },
        { status: 500 }
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
      console.log(`[GitHub Push AGENTS Mock Mode] Menirukan pembuatan file AGENTS.md untuk repositori ${owner}/${repo}`);
      return NextResponse.json({
        success: true,
        isMock: true,
        message: `[MOCK MODE - TESTING] File AGENTS.md sukses disimulasikan dibuat di root repository (offline/kredensial GitHub tidak tersedia).`
      });
    }

    const accessToken = tokenData.access_token;
    const octokit = new Octokit({ auth: accessToken });

    // 1. Get default branch of the repository
    let defaultBranch = 'main';
    try {
      const { data: repoInfo } = await octokit.rest.repos.get({
        owner,
        repo
      });
      defaultBranch = repoInfo.default_branch || 'main';
    } catch (repoErr: any) {
      console.warn(`[GitHub Push AGENTS] Gagal mengambil info repo, default ke 'main':`, repoErr.message);
    }

    // 2. Check if AGENTS.md already exists to retrieve SHA
    let agentsSha: string | undefined;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'AGENTS.md',
        ref: defaultBranch
      }) as any;
      agentsSha = fileData.sha;
    } catch (e) {
      // Ignore 404
    }

    // 3. Commit/Push AGENTS.md to root repository
    console.log(`[GitHub Push AGENTS] Mengunggah file AGENTS.md ke root repositori ${owner}/${repo}...`);
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'AGENTS.md',
      branch: defaultBranch,
      message: 'csa: initialize AGENTS.md in repository root',
      content: Buffer.from(agentsContent).toString('base64'),
      sha: agentsSha
    });

    console.log(`[GitHub Push AGENTS] Sukses mengunggah AGENTS.md ke repositori.`);
    return NextResponse.json({
      success: true,
      isMock: false,
      message: `File AGENTS.md berhasil di-push secara nyata ke root branch "${defaultBranch}" di repositori ${owner}/${repo}.`
    });

  } catch (err: any) {
    console.error('Error inside push-agents endpoint:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan internal server saat membuat AGENTS.md.' },
      { status: 500 }
    );
  }
}
