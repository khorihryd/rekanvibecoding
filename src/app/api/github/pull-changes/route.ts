import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { userId, repoUrl, branchName, baseBranch } = await request.json();

    if (!userId || !repoUrl || !branchName) {
      return NextResponse.json(
        { success: false, error: 'Parameter userId, repoUrl, dan branchName wajib diisi.' },
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

    // Fallback Mock Mode: if token is not found or client credentials are missing
    if (tokenError || !tokenData?.access_token || !process.env.GITHUB_CLIENT_ID) {
      console.log(`[GitHub Pull Mock Mode] Menirukan pengambilan diff untuk branch: ${branchName}`);
      
      let mockDiff = '';
      const lowerBranch = branchName.toLowerCase();
      
      if (lowerBranch.includes('sentry') || lowerBranch.includes('error')) {
        mockDiff = `diff --git a/package.json b/package.json
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
        mockDiff = `diff --git a/src/app/dashboard/page.tsx b/src/app/dashboard/page.tsx
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
        mockDiff = `diff --git a/src/app/page.tsx b/src/app/page.tsx
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

      return NextResponse.json({
        success: true,
        isMock: true,
        diffText: mockDiff,
        message: 'Mode mockup diaktifkan. Perubahan kode disimulasikan secara offline.'
      });
    }

    const accessToken = tokenData.access_token;
    const octokit = new Octokit({ auth: accessToken });

    // Determine target base branch
    let targetBase = baseBranch;
    if (!targetBase) {
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      targetBase = repoData.default_branch;
    }

    console.log(`[GitHub Pull] Membandingkan branch ${targetBase} dengan ${branchName} di ${owner}/${repo}`);

    // Request the raw diff string from GitHub API
    const diffResponse = await octokit.request('GET /repos/{owner}/{repo}/compare/{base}...{head}', {
      owner,
      repo,
      base: targetBase,
      head: branchName,
      headers: {
        accept: 'application/vnd.github.v3.diff'
      }
    });

    const diffText = diffResponse.data as unknown as string;

    return NextResponse.json({
      success: true,
      isMock: false,
      diffText,
      message: `Berhasil menarik perubahan kode (git diff) antara branch ${targetBase} dan ${branchName}.`
    });

  } catch (err: any) {
    console.error('Error pulling git diff from GitHub compare:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menarik perubahan diff kode dari GitHub.' },
      { status: 500 }
    );
  }
}
