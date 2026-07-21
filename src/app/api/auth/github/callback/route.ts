import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // User ID passed as state

  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';

  if (!code || !state) {
    const errorUrl = `${protocol}://${host}/dashboard?github_error=Code%20atau%20state%20tidak%20ditemukan`;
    return NextResponse.redirect(errorUrl);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    const errorUrl = `${protocol}://${host}/dashboard?github_error=GitHub%20OAuth%20credentials%20belum%20dikonfigurasi`;
    return NextResponse.redirect(errorUrl);
  }

  try {
    // Exchange code for GitHub Access Token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Access token tidak dikembalikan oleh GitHub');
    }

    // Upsert access token securely in database using service client
    const { error: dbError } = await supabaseServer
      .from('github_tokens')
      .upsert({
        user_id: state,
        access_token: accessToken,
      });

    if (dbError) throw dbError;

    // Redirect to dashboard on success
    const dashboardUrl = `${protocol}://${host}/dashboard?github=connected`;
    return NextResponse.redirect(dashboardUrl);
  } catch (err: any) {
    const errorUrl = `${protocol}://${host}/dashboard?github_error=${encodeURIComponent(
      err.message || 'unknown_error'
    )}`;
    return NextResponse.redirect(errorUrl);
  }
}
