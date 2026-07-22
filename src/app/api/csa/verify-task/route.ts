import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { Octokit } from 'octokit';
import { generateTextContent } from '@/lib/ai';
import { CSA_VERIFICATION_PROMPT } from '@/lib/csa/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { taskId, userId, model = 'gemini-1.5-pro' } = await request.json();

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

    // Static Audit Pre-checks (Hard rejection rules: RLS bypass & missing error handling)
    const lowerDiff = diffText.toLowerCase();
    const hasRlsBypass = lowerDiff.includes('service_role') || lowerDiff.includes('bypass_rls') || lowerDiff.includes('supabase_service_key');
    
    // We expect JS/TS files to have error handling (try/catch) and sentry integrations if they are modified
    const hasErrorHandling = lowerDiff.includes('try') || lowerDiff.includes('catch') || lowerDiff.includes('sentry');

    let evaluationData: any = null;
    let hardRejection = false;

    if (hasRlsBypass) {
      hardRejection = true;
      evaluationData = {
        approved: false,
        score: 30,
        reasoning: '[Audit Penolakan Keras Static Check] Kode ditolak otomatis karena terdeteksi potensi celah keamanan RLS bypass atau pemanggilan service role key dari client-side UI.',
        feedback: [
          'Dilarang memanggil service_role client dari sisi UI frontend.',
          'Semua endpoint/operasi database harus mematuhi Supabase Row Level Security (RLS) user session.'
        ]
      };
    } else if (!hasErrorHandling) {
      hardRejection = true;
      evaluationData = {
        approved: false,
        score: 55,
        reasoning: '[Audit Penolakan Keras Static Check] Kode ditolak otomatis karena tidak menyertakan penanganan error (try/catch) atau integrasi Sentry pada berkas logika yang diubah.',
        feedback: [
          'Seluruh pemanggilan API luar, endpoint server, dan query database wajib dibungkus try/catch block.',
          'Tangkap exception dan pastikan dikirim ke Sentry untuk penelusuran error.'
        ]
      };
    }

    let modelUsed = 'MockEngine';

    if (!hardRejection) {
      // Return success indicating both inputs were successfully loaded and evaluated
      console.log(`[CSA Verification Controller] Berhasil memuat spesifikasi tugas (${specMarkdown.length} karakter) dan diff perubahan (${diffText.length} karakter). Ready for evaluation.`);

      // 4. Construct prompt for evaluator to match "Definition of Done"
      const combinedPrompt = `
Lakukan audit kode secara mendalam berdasarkan spesifikasi tugas (Task Specification) dan perubahan kode (Git Diff) berikut.

Spesifikasi Tugas (Task Specification):
---
${specMarkdown}
---

Perubahan Kode (Git Diff):
---
${diffText}
---

Kembalikan respon evaluasi final Anda dalam format JSON murni dengan skema berikut:
{
  "approved": boolean,
  "score": number,
  "reasoning": string,
  "feedback": string[]
}
`;

      // 5. Call LLM using helper with CSA_VERIFICATION_PROMPT
      const aiResult = await generateTextContent({
        prompt: combinedPrompt,
        systemPrompt: CSA_VERIFICATION_PROMPT,
        model
      });
      modelUsed = aiResult.modelUsed || 'MockEngine';

      // 6. Parse JSON from AI response
      if (aiResult.isMock) {
        // Mock evaluation response based on diff content
        const lowerDiff = diffText.toLowerCase();
        const hasErrorOrBypass = lowerDiff.includes('bypass') || lowerDiff.includes('service_role') || lowerDiff.includes('anykey');
        const hasErrorHandling = lowerDiff.includes('sentry') || lowerDiff.includes('try') || lowerDiff.includes('catch');
        
        if (hasErrorOrBypass) {
          evaluationData = {
            approved: false,
            score: 40,
            reasoning: '[Mockup Audit] Audit ditolak. Ditemukan potensi celah keamanan kritis terkait RLS bypass atau penggunaan service role key yang tidak sah di sisi frontend.',
            feedback: [
              'Dilarang melakukan bypass RLS Supabase dengan memanggil service role client dari client-side UI.',
              'Amankan variabel lingkungan server-side agar tidak bocor ke client bundle.'
            ]
          };
        } else if (!hasErrorHandling) {
          evaluationData = {
            approved: false,
            score: 65,
            reasoning: '[Mockup Audit] Audit ditolak. Perubahan kode fungsional sudah sesuai, tetapi tidak memiliki penanganan error yang memadai untuk dikirim ke Sentry.',
            feedback: [
              'Tambahkan block try/catch untuk menangani database error.',
              'Pastikan error dilempar ke Sentry menggunakan captureException di block catch.'
            ]
          };
        } else {
          evaluationData = {
            approved: true,
            score: 95,
            reasoning: '[Mockup Audit] Audit diterima! Kode terstruktur rapi, mematuhi spesifikasi task, mengaktifkan penanganan error Sentry yang tepat, dan mematuhi RLS policies.',
            feedback: []
          };
        }
      } else {
        try {
          let jsonText = aiResult.text.trim();
          // Remove markdown block wraps if present
          if (jsonText.startsWith('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
          } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.split('```')[1].split('```')[0].trim();
          }
          
          evaluationData = JSON.parse(jsonText);
        } catch (parseErr: any) {
          console.error('Failed to parse AI JSON response:', aiResult.text);
          evaluationData = {
            approved: false,
            score: 50,
            reasoning: 'Gagal mengurai respon terstruktur JSON dari AI.',
            feedback: ['Respon AI tidak berformat JSON: ' + aiResult.text]
          };
        }
      }
    }

    // 7. Compile Markdown report matching Task 5.4
    const reportMarkdown = `# 🔍 LAPORAN AUDIT OTOMATIS CSA (CHIEF SOFTWARE ARCHITECT)
**Task ID:** ${task.id}
**Task Title:** ${task.title}
**Branch:** ${branchName}
**Hasil Penilaian:** ${evaluationData.approved ? '✅ APPROVED (TEKNIS)' : '❌ REJECTED'}
**Skor Kualitas:** ${evaluationData.score}/100

## 1. Analisis & Reasoning
${evaluationData.reasoning}

## 2. Masukan Perbaikan (Feedback)
${
  evaluationData.feedback && evaluationData.feedback.length > 0
    ? evaluationData.feedback.map((f: string) => `- ${f}`).join('\n')
    : '- Tidak ada catatan perbaikan. Kode sudah memenuhi standar arsitektur.'
}
`;

    const reportPath = `csa-sync/outbox/report-${task.id}.md`;
    let isReportSynced = false;
    let syncMessage = '';

    if (isMock) {
      isReportSynced = true;
      syncMessage = `[Mock] Laporan audit berhasil di-commit secara virtual ke berkas "${reportPath}" di branch "${branchName}".`;
      console.log(`[GitHub Report Sync Mock Mode] Commit file ${reportPath} ke branch ${branchName}`);
    } else {
      // Sync report to actual GitHub repository
      try {
        let owner = '';
        let repo = '';

        if (repoUrl.includes('github.com/')) {
          const parts = repoUrl.split('github.com/')[1].split('/');
          owner = parts[0];
          repo = parts[1]?.replace('.git', '');
        }

        const accessToken = tokenData?.access_token || '';
        const octokit = new Octokit({ auth: accessToken });

        // Check if report file already exists to get its SHA
        let reportSha: string | undefined;
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: reportPath,
            ref: branchName
          }) as any;
          reportSha = fileData.sha;
        } catch (e) {
          // Report file doesn't exist yet, ignore 404
        }

        // Commit or Update Report file
        await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: reportPath,
          branch: branchName,
          message: `csa: publish audit report for task ${task.id}`,
          content: Buffer.from(reportMarkdown).toString('base64'),
          sha: reportSha
        });

        isReportSynced = true;
        syncMessage = `Laporan audit berhasil di-commit ke berkas "${reportPath}" di branch "${branchName}".`;
        console.log(`[GitHub Report Sync] Sukses commit berkas ${reportPath} ke branch ${branchName}`);
      } catch (syncErr: any) {
        console.error('Error committing audit report to GitHub:', syncErr.message || syncErr);
        syncMessage = `Gagal menyinkronkan laporan audit ke GitHub: ${syncErr.message || syncErr}`;
      }
    }

    return NextResponse.json({
      success: true,
      isMock,
      taskId: task.id,
      taskTitle: task.title,
      branchName,
      evaluation: evaluationData,
      reportMarkdown,
      isReportSynced,
      syncMessage,
      modelUsed,
      message: 'CSA Verifier Controller sukses melakukan verifikasi dan mempublikasikan laporan audit.'
    });

  } catch (err: any) {
    console.error('Error inside CSA verification controller:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Terjadi kesalahan sistem saat memproses data verifikasi.' },
      { status: 500 }
    );
  }
}
