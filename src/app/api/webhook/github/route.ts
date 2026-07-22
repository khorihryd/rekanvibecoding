import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON webhook payload from GitHub
    const payload = await request.json();

    // Extract basic information from GitHub push event payload
    const repoName = payload.repository?.full_name || 'unknown/repository';
    const ref = payload.ref || '';
    const branch = ref.replace('refs/heads/', '') || 'unknown-branch';
    const pusher = payload.pusher?.name || 'unknown-pusher';
    const commits = payload.commits || [];

    // Print webhook logging details to console/logs
    console.log('=================== GITHUB WEBHOOK RECEIVED ===================');
    console.log(`Repository : ${repoName}`);
    console.log(`Branch     : ${branch}`);
    console.log(`Pusher     : ${pusher}`);
    console.log(`Commits    : ${commits.length} commit(s) received`);
    commits.forEach((commit: any, index: number) => {
      console.log(`  [${index + 1}] ${commit.message} - by ${commit.author?.name}`);
    });
    console.log('================================================================');

    // Query tasks matching this branch name along with their project URL
    const { data: tasks, error: dbError } = await supabaseServer
      .from('tasks')
      .select('*, projects:project_id(github_repo_url)')
      .eq('branch_name', branch);

    let updatedTasksCount = 0;

    if (!dbError && tasks && tasks.length > 0) {
      for (const task of tasks) {
        if (task.status === 'inbox') {
          const projectRepoUrl = (task.projects as any)?.github_repo_url || '';
          
          // Verify that the webhook repo matches the task's project repo URL
          if (projectRepoUrl.toLowerCase().includes(repoName.toLowerCase())) {
            const { error: updateError } = await supabaseServer
              .from('tasks')
              .update({
                status: 'in_progress',
                updated_at: new Date().toISOString()
              })
              .eq('id', task.id);

            if (!updateError) {
              console.log(`[Webhook Update] Task "${task.title}" (ID: ${task.id}) berhasil dipindahkan ke IN_PROGRESS.`);
              updatedTasksCount++;
            } else {
              console.error(`[Webhook Update Error] Gagal update status task ${task.id}:`, updateError.message);
            }
          }
        }
      }
    }

    // Return success response to GitHub Webhook Engine
    return NextResponse.json({
      received: true,
      repository: repoName,
      branch: branch,
      pusher: pusher,
      commitCount: commits.length,
      updatedTasksCount
    }, { status: 200 });

  } catch (err: any) {
    console.error('Error handling GitHub webhook payload:', err.message || err);
    return NextResponse.json({
      received: false,
      error: err.message || 'Gagal memproses payload webhook'
    }, { status: 400 });
  }
}

// Support GET to quickly verify endpoint is live
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'GitHub Webhook endpoint is live. Send a POST request with GitHub webhook payload.'
  });
}
