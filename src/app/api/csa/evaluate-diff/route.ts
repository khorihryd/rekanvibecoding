import { NextResponse } from 'next/server';
import { generateTextContent } from '@/lib/ai';
import { CSA_VERIFICATION_PROMPT } from '@/lib/csa/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { taskSpec, diffText, model = 'gemini-1.5-pro' } = await request.json();

    if (!taskSpec || !diffText) {
      return NextResponse.json(
        { success: false, error: 'taskSpec dan diffText wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Construct prompt for evaluator
    const combinedPrompt = `
Lakukan audit kode secara mendalam berdasarkan spesifikasi tugas (Task Specification) dan perubahan kode (Git Diff) berikut.

Spesifikasi Tugas (Task Specification):
---
${taskSpec}
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

    // 2. Call LLM using helper with CSA_VERIFICATION_PROMPT
    const aiResult = await generateTextContent({
      prompt: combinedPrompt,
      systemPrompt: CSA_VERIFICATION_PROMPT,
      model
    });

    // 3. Parse JSON from AI response
    let evaluationData: any;
    
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
        // Fallback structural parsing if JSON fails
        evaluationData = {
          approved: false,
          score: 50,
          reasoning: 'Gagal mengurai respon terstruktur JSON dari AI.',
          feedback: ['Respon AI tidak berformat JSON: ' + aiResult.text]
        };
      }
    }

    return NextResponse.json({
      success: true,
      evaluation: evaluationData,
      modelUsed: aiResult.modelUsed,
      isMock: aiResult.isMock
    });

  } catch (err: any) {
    console.error('Error in evaluate-diff route:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengevaluasi perubahan kode.' },
      { status: 500 }
    );
  }
}
