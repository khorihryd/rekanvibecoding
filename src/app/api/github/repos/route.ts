import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';

const MOCK_REPOSITORIES = [
  { id: 101, name: 'rekanvibecoding', full_name: 'khori/rekanvibecoding', html_url: 'https://github.com/khori/rekanvibecoding', private: true, isMock: true },
  { id: 102, name: 'csa-architect-app', full_name: 'khori/csa-architect-app', html_url: 'https://github.com/khori/csa-architect-app', private: false, isMock: true },
  { id: 103, name: 'nextjs-saas-boilerplate', full_name: 'khori/nextjs-saas-boilerplate', html_url: 'https://github.com/khori/nextjs-saas-boilerplate', private: true, isMock: true }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // If GITHUB_CLIENT_ID is missing, immediately fallback to mock data to ease local dev
  if (!process.env.GITHUB_CLIENT_ID) {
    return NextResponse.json({
      connected: false,
      isMock: true,
      repos: MOCK_REPOSITORIES,
      note: 'GitHub OAuth Client ID belum dikonfigurasi. Menggunakan data repositori mockup untuk pengujian lokal.'
    });
  }

  try {
    // Fetch user access token from Supabase using server role client
    const { data, error } = await supabaseServer
      .from('github_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    if (error || !data?.access_token) {
      // Return mock repositories but indicate they are not connected to GitHub yet
      return NextResponse.json({
        connected: false,
        isMock: true,
        repos: MOCK_REPOSITORIES,
        note: 'Akun GitHub belum dihubungkan. Silakan hubungkan repositori Anda atau gunakan pilihan mockup.'
      });
    }

    // Call GitHub API to get user repositories
    const githubResponse = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CSA-App'
      }
    });

    if (!githubResponse.ok) {
      throw new Error(`GitHub API error: ${githubResponse.statusText}`);
    }

    const reposData = await githubResponse.json();

    const repos = reposData.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      html_url: repo.html_url,
      private: repo.private,
      isMock: false
    }));

    return NextResponse.json({
      connected: true,
      isMock: false,
      repos
    });
  } catch (err: any) {
    // If anything fails, return mock repositories to prevent blocking local dev
    return NextResponse.json({
      connected: false,
      isMock: true,
      repos: MOCK_REPOSITORIES,
      error: err.message || 'Gagal mengambil repositori dari GitHub'
    });
  }
}
