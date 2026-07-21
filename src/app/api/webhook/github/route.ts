import { NextResponse } from 'next/server';

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

    // Return success response to GitHub Webhook Engine
    return NextResponse.json({
      received: true,
      repository: repoName,
      branch: branch,
      pusher: pusher,
      commitCount: commits.length
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
