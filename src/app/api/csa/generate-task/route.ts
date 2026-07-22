import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { generateTextContent } from '@/lib/ai';
import { CSA_TASK_GENERATION_PROMPT } from '@/lib/csa/prompts';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { projectId, userId, taskTitle, model = 'gemini-1.5-pro' } = await request.json();

    if (!projectId || !userId || !taskTitle) {
      return NextResponse.json(
        { success: false, error: 'projectId, userId, dan taskTitle wajib diisi.' },
        { status: 400 }
      );
    }

    // 1. Fetch project state context_markdown
    const { data: stateData } = await supabaseServer
      .from('project_state')
      .select('context_markdown')
      .eq('project_id', projectId)
      .single();

    const projectContext = stateData?.context_markdown || 'Belum ada konteks arsitektur.';

    // 2. Fetch project active decisions
    const { data: decisionsData } = await supabaseServer
      .from('decisions')
      .select('decision_text, reasoning')
      .eq('project_id', projectId);

    const decisionsList = decisionsData || [];
    const decisionsContext = decisionsList
      .map((d, i) => `Keputusan [${i + 1}]: ${d.decision_text}\nAlasan: ${d.reasoning}`)
      .join('\n\n');

    // 3. Construct the combined prompt
    const combinedPrompt = `
Berikut adalah status arsitektur proyek saat ini:
---
${projectContext}
---

Keputusan arsitektur resmi yang harus dipatuhi:
---
${decisionsContext || 'Belum ada keputusan resmi.'}
---

Permintaan Fitur Pengguna yang harus didekomposisi menjadi tugas (Task Specification):
Fitur: "${taskTitle}"
`;

    // 4. Call LLM using helper with CSA_TASK_GENERATION_PROMPT
    const aiResult = await generateTextContent({
      prompt: combinedPrompt,
      systemPrompt: CSA_TASK_GENERATION_PROMPT,
      model
    });

    // 5. Slugify the task title to get a clean branch name
    const branchName = `feature/task-${taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || Date.now()}`;

    // 6. Insert new task into database using service client
    const { data: taskData, error: dbError } = await supabaseServer
      .from('tasks')
      .insert([
        {
          project_id: projectId,
          title: taskTitle,
          spec_markdown: aiResult.text,
          status: 'draft',
          branch_name: branchName
        }
      ])
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      task: taskData,
      isMock: aiResult.isMock
    });

  } catch (err: any) {
    console.error('Error in generate-task route:', err.message || err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menghasilkan spesifikasi task.' },
      { status: 500 }
    );
  }
}
