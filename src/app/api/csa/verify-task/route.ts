import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { taskId, userId } = await request.json();

    if (!taskId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Parameter taskId dan userId wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Fetch task spec from DB
    const { data: task, error: taskError } = await supabaseServer
      .from('tasks')
      .select('*, projects:project_id(*)')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json(
        { success: false, error: `Gagal membaca task dengan ID ${taskId} dari database: ${taskError?.message}` },
        { status: 404 }
      );
    }

    const specMarkdown = task.spec_markdown || '';
    const branchName = task.branch_name || '';
    const repoUrl = (task.projects as any)?.github_repo_url || '';

    if (!branchName) {
      return NextResponse.json(
        { success: false, error: 'Task tidak memiliki branch_name terdaftar.' },
        { status: 400 }
      );
    }

    console.log(`[CSA Verification Controller] Memulai Task 5.1 untuk task: "${task.title}" (ID: ${task.id})`);
    console.log(`[CSA Verification Controller] Mengambil diff branch: ${branchName}`);

    let diffText = '';
    let isMock = false;

    // 2. Fetch user's access token from Supabase
    const { data: tokenData, error: tokenError } = await supabaseServer
      .from('github_tokens')
      .select('access_token')
      .eq('user_id', userId)
      .single();

    // Fallback Mock Mode: if token is not found or client ID is missing
    if (tokenError || !tokenData?.access_token || !process.env.GITHUB_CLIENT_ID || !repoUrl) {
      isMock = true;
      console.log(`[CSA Verification Controller] Mode mockup aktif. Mensimulasikan pengambilan diff untuk branch: ${branchName}`);
      
      const lowerBranch = branchName.toLowerCase();
      if (lowerBranch.includes('sentry') || lowerBranch.includes('error')) {
        diffText = `diff --git a/package.json b/package.json
index a1b2c3d..e5f6g7h 100644
--- a/package.json
+++ b/package.json
@@ -15,4 +15,5 @@
     "@supabase/supabase-js": "^2.39.0",
     "next": "16.2.10",
+    "@sentry/nextjs": "^8.0.0",
     "react": "^19.0.0",
diff --git a/src/app/api/test-sentry/route.ts b/src/app/api/test-sentry/route.ts
new file mode 100644
index 0000000..8b7c6d5
--- /dev/null
+++ b/src/app/api/test-sentry/route.ts
@@ -0,0 +1,12 @@
+import { NextResponse } from 'next/server';
+import * as Sentry from '@sentry/nextjs';
+
+export async function GET() {
+  try {
+    throw new Error('Sentry test error!');
+  } catch (err) {
+    Sentry.captureException(err);
+    return NextResponse.json({ success: true, message: 'Captured error in Sentry.' });
+  }
+}`;
      } else if (lowerBranch.includes('bypass') || lowerBranch.includes('rls') || lowerBranch.includes('security')) {
        diffText = `diff --git a/src/app/dashboard/page.tsx b/src/app/dashboard/page.tsx
index 2c3d4e5..8f9g0h1 100644
--- a/src/app/dashboard/page.tsx
+++ b/src/app/dashboard/page.tsx
@@ -120,4 +120,8 @@ export default function Dashboard() {
+  // CRITICAL BYPASS: Bypassing Supabase RLS using service role key on frontend
+  // const supabase = createClient(URL, SERVICE_ROLE_KEY); 
+  const rlsBypassFetch = async () => {
+    const res = await fetch('/api/test-supabase?bypass=true');
+  };`;
      } else {
        diffText = `diff --git a/src/app/page.tsx b/src/app/page.tsx
index 8b9c7d2..6f5e4d2 100644
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@ -5,2 +5,3 @@ export default function Page() {
   return (
+    <div className="p-4 bg-indigo-950/20 rounded-xl">
       <h1>Selamat Datang di Portal Vibe Coding</h1>
+    </div>
   );
 }`;
      }
    } else {
      // 3. Connect to GitHub and fetch actual diff
      try {
        let owner = '';
        let repo = '';

        if (repoUrl.includes('github.com/')) {
          const parts = repoUrl.split('github.com/')[1].split('/');
          owner = parts[0];
          repo = parts[1]?.replace('.git', '');
        }

        const accessToken = tokenData.access_token;
        const octokit = new Octokit({ auth: accessToken });

        // Get default branch
        const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = repoData.default_branch;

        // Fetch diff text
        const diffResponse = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
          owner,
          repo,
          base: defaultBranch,
          head: branchName,
          headers: {
            accept: 'application/vnd.github.v3.diff'
          }
        });

        diffText = diffResponse.data as unknown as string;
      } catch (err: any) {
        console.error('Error fetching git diff inside verifier controller:', err.message || err);
        return NextResponse.json(
          { success: false, error: `Gagal menarik git diff dari repository: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // Return success indicating both inputs were successfully loaded
    console.log(`[CSA Verification Controller] Berhasil memuat spesifikasi tugas (${specMarkdown.length} karakter) dan diff perubahan (${diffText.length} karakter). Ready for evaluation.`);

    return NextResponse.json({
      success: true,
      isMock,
      taskId: task.id,
      taskTitle: task.title,
      branchName,
      specMarkdown,
      diffText,
      message: 'CSA Verifier Controller sukses membaca spesifikasi tugas dari DB dan diff kode dari repositori.'
    });

  } catch (err: any) {
    console.error('Error inside CSA verification controller:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem saat memproses data verifikasi.' },
      { status: 500 }
    );
  }
}
