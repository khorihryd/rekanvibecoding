import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID (state) is required' }, { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'GitHub OAuth Client ID atau Redirect URI belum dikonfigurasi di environment variables.' },
      { status: 500 }
    );
  }

  // Redirect to GitHub Authorization page
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo&state=${userId}`;

  return NextResponse.redirect(githubAuthUrl);
}
