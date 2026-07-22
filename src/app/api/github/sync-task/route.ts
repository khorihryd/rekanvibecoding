import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, projectId, taskId, repoUrl, branchName, specMarkdown } = await request.json();

    if (!userId || !repoUrl || !branchName || !specMarkdown || !taskId) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId, repoUrl, branchName, specMarkdown, dan taskId wajib diisi.' },
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
      console.log(`[GitHub Sync Mock Mode] Menirukan commit file csa-sync/inbox/task-${taskId}.md ke branch: ${branchName}`);
      return NextResponse.json({
        success: true,
        isMock: true,
        message: `[Mockup] Spesifikasi task berhasil di-commit secara virtual ke branch "${branchName}" di repositori ${owner}/${repo}.`,
        details: 'Mode mockup diaktifkan karena token GitHub atau client credentials belum tersedia.'
      });
    }

    const accessToken = tokenData.access_token;
    const octokit = new Octokit({ auth: accessToken });
    const filePath = `csa-sync/inbox/task-${taskId}.md`;

    console.log(`[GitHub Sync] Memulai proses sync spesifikasi task ${taskId} ke branch ${branchName}`);

    // 1. Get default branch (usually main or master)
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const defaultBranch = repoData.default_branch;

    // 2. Check if the target branch already exists, if not, create it
    let branchExists = false;
    try {
      await octokit.rest.repos.getBranch({ owner, repo, branch: branchName });
      branchExists = true;
      console.log(`[GitHub Sync] Branch target "${branchName}" sudah ada.`);
    } catch (err: any) {
      if (err.status === 404) {
        console.log(`[GitHub Sync] Branch target "${branchName}" tidak ditemukan. Membuat branch baru...`);
      } else {
        throw err;
      }
    }

    if (!branchExists) {
      // Get SHA of default branch reference to branch from it
      const { data: refData } = await octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`
      });
      const parentSha = refData.object.sha;

      // Create target branch
      await octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: parentSha
      });
      console.log(`[GitHub Sync] Branch target "${branchName}" berhasil dibuat dari branch "${defaultBranch}".`);
    }

    // 3. Check if target file already exists in branch to get its SHA (for replacement/update contents)
    let fileSha: string | undefined;
    try {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: branchName
      }) as any;
      fileSha = fileData.sha;
      console.log(`[GitHub Sync] File ${filePath} sudah ada. SHA terdeteksi: ${fileSha}. Melakukan update berkas...`);
    } catch (err: any) {
      if (err.status === 404) {
        console.log(`[GitHub Sync] File ${filePath} belum ada. Membuat berkas baru...`);
      } else {
        throw err;
      }
    }

    // 4. Create or Update File Contents
    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      branch: branchName,
      message: `csa: sync task specification for task ${taskId}`,
      content: Buffer.from(specMarkdown).toString('base64'),
      sha: fileSha
    });

    console.log(`[GitHub Sync] Sukses commit berkas ${filePath} ke branch ${branchName}.`);

    return NextResponse.json({
      success: true,
      isMock: false,
      message: `Spesifikasi task berhasil di-commit ke branch "${branchName}" di repositori ${owner}/${repo}!`,
      filePath
    });

  } catch (err: any) {
    console.error('Error syncing task spec to GitHub:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyinkronkan spesifikasi task ke GitHub.' },
      { status: 500 }
    );
  }
}
