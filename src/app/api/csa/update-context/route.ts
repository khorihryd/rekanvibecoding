import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateTextContent } from '@/lib/ai';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { projectId, userId, diffText, model = 'gemini-1.5-pro' } = await request.json();

    if (!projectId || !userId || !diffText) {
      return NextResponse.json(
        { success: false, error: 'projectId, userId, dan diffText wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Fetch current project state context
    const { data: stateData, error: dbFetchError } = await supabaseServer
      .from('project_state')
      .select('context_markdown')
      .eq('project_id', projectId)
      .single();

    if (dbFetchError) throw dbFetchError;

    const projectContext = stateData?.context_markdown || '';

    // 2. Prepare System Prompt for Context Updater
    const systemPrompt = `
Anda adalah CSA (Chief Software Architect). Tugas Anda adalah memperbarui dokumen status konteks proyek (\`context.md\`) berdasarkan perubahan kode (git diff) yang baru saja berhasil digabungkan (merged).

Aturan pembaruan:
1. Tetap pertahankan struktur dokumen markdown yang ada (Deskripsi, Teknologi Utama, Arsitektur & Aturan, Status Terakhir).
2. Perbarui bagian "Teknologi Utama" jika ada library/SDK baru yang diinstal di package.json.
3. Tambahkan poin pencapaian baru di bawah bagian "Status Terakhir" untuk mencatat fitur yang baru saja digabungkan. Jangan menghapus catatan sejarah pencapaian lama, cukup tambahkan yang terbaru di baris paling bawah.
4. Hasilkan teks Markdown baru secara lengkap tanpa melampirkan teks penjelasan tambahan di luar markdown.
`;

    // 3. Construct prompt
    const combinedPrompt = `
Dokumen Context Arsitektur Proyek Saat Ini:
---
${projectContext}
---

Perubahan Kode yang Baru Saja Dimerge (Git Diff):
---
${diffText}
---

Revisi dokumen di atas agar mencerminkan perubahan ini secara akurat. Kembalikan teks Markdown hasil revisi secara lengkap.
`;

    // 4. Call LLM
    const aiResult = await generateTextContent({
      prompt: combinedPrompt,
      systemPrompt,
      model
    });

    let revisedContext = aiResult.text;

    // 5. Handle mock fallback logic
    if (aiResult.isMock) {
      revisedContext = projectContext;
      const dateStr = new Date().toISOString().split('T')[0];
      
      let featureName = 'penyempurnaan sistem';
      const lowerDiff = diffText.toLowerCase();
      if (lowerDiff.includes('sentry')) featureName = 'Integrasi pemantauan error Sentry dasar';
      else if (lowerDiff.includes('webhook')) featureName = 'Webhook penerima event GitHub push';
      else if (lowerDiff.includes('oauth') || lowerDiff.includes('github_tokens')) featureName = 'Koneksi GitHub OAuth portal';
      else if (lowerDiff.includes('evaluate-diff')) featureName = 'Audit otomatis perbedaan kode (diff evaluator)';
      else if (lowerDiff.includes('generate-task')) featureName = 'Dekomposisi spesifikasi task oleh CSA';
      else if (lowerDiff.includes('update-context')) featureName = 'Pembaruan otomatis dokumen context arsitektur (context updater)';
      
      const newAchievement = `\n- Berhasil mengintegrasikan ${featureName} (Dimerge pada ${dateStr}).`;
      
      if (revisedContext.includes('## Status Terakhir')) {
        revisedContext = revisedContext.replace('## Status Terakhir', `## Status Terakhir${newAchievement}`);
      } else {
        revisedContext = `${revisedContext}\n\n## Status Terakhir${newAchievement}`;
      }
    }

    // 6. Save the revised context markdown back to the Supabase database
    const { error: dbUpdateError } = await supabaseServer
      .from('project_state')
      .update({
        context_markdown: revisedContext,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    if (dbUpdateError) throw dbUpdateError;

    return NextResponse.json({
      success: true,
      contextMarkdown: revisedContext,
      modelUsed: aiResult.modelUsed,
      isMock: aiResult.isMock
    });

  } catch (err: any) {
    console.error('Error in update-context route:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memperbarui context arsitektur.' },
      { status: 500 }
    );
  }
}
