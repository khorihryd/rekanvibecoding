import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, projectId, taskId, repoUrl, branchName } = await request.json();

    if (!userId || !projectId || !taskId || !repoUrl || !branchName) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId, projectId, taskId, repoUrl, dan branchName wajib diisi.' },
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

    // Retrieve user access token from Supabase using server role client
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from('github_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    // Fallback Mock Mode: if token is not found or client ID is missing
    if (tokenError || !tokenData?.access_token || !process.env.GITHUB_CLIENT_ID) {
      console.log(`[GitHub Merge Mock Mode] Menirukan merge branch ${branchName} ke main untuk repositori ${owner}/${repo}`);
      return NextResponse.json({
        success: true,
        isMock: true,
        message: `[MOCK MODE - TESTING] Penggabungan (merge) branch "${branchName}" sukses disimulasikan secara offline (karena kredensial GitHub nyata tidak tersedia).`,
        details: 'Mode mockup diaktifkan untuk keperluan testing development.'
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
      console.warn(`[GitHub Merge] Gagal mengambil info repo, default ke 'main':`, repoErr.message);
    }

    // 2. Check if a Pull Request already exists
    let prNumber: number;
    try {
      const { data: pulls } = await octokit.rest.pulls.list({
        owner,
        repo,
        head: `${owner}:${branchName}`,
        base: defaultBranch,
        state: 'open'
      });

      if (pulls.length > 0) {
        prNumber = pulls[0].number;
        console.log(`[GitHub Merge] PR sudah ada (PR #${prNumber}).`);
      } else {
        // Create new Pull Request
        console.log(`[GitHub Merge] Membuat PR baru untuk branch ${branchName} ke ${defaultBranch}.`);
        const { data: newPr } = await octokit.rest.pulls.create({
          owner,
          repo,
          title: `csa: merge branch ${branchName} to ${defaultBranch}`,
          head: branchName,
          base: defaultBranch,
          body: `Automated pull request created by CSA (Chief Software Architect) for task ${taskId}.`
        });
        prNumber = newPr.number;
        console.log(`[GitHub Merge] PR #${prNumber} berhasil dibuat.`);
      }
    } catch (prErr: any) {
      console.error(`[GitHub Merge] Error saat mempersiapkan Pull Request:`, prErr);
      return NextResponse.json(
        { success: false, error: `Gagal membuat/mencari Pull Request di GitHub: ${prErr.message || prErr}` },
        { status: 500 }
      );
    }

    // 3. Merge the Pull Request
    console.log(`[GitHub Merge] Memulai merge PR #${prNumber} ke branch ${defaultBranch}...`);
    try {
      const { data: mergeResult } = await octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        merge_method: 'merge'
      });

      if (mergeResult.merged) {
        console.log(`[GitHub Merge] PR #${prNumber} sukses di-merge.`);
        return NextResponse.json({
          success: true,
          isMock: false,
          message: `Branch "${branchName}" berhasil di-merge secara nyata ke branch default "${defaultBranch}" di repositori ${owner}/${repo} (PR #${prNumber}).`,
          prNumber
        });
      } else {
        return NextResponse.json(
          { success: false, error: 'Penggabungan PR ditolak atau gagal oleh GitHub.' },
          { status: 500 }
        );
      }
    } catch (mergeErr: any) {
      console.error(`[GitHub Merge] Error saat mengeksekusi merge:`, mergeErr);
      return NextResponse.json(
        { success: false, error: `Gagal melakukan merge branch di GitHub (kemungkinan konflik kode): ${mergeErr.message || mergeErr}` },
        { status: 500 }
      );
    }

  } catch (err: any) {
    console.error('Error inside merge-task endpoint:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan internal server saat melakukan merge.' },
      { status: 500 }
    );
  }
}
