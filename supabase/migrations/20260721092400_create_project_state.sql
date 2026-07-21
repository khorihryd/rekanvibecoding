-- Create project_state table
CREATE TABLE IF NOT EXISTS public.project_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
    context_markdown TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.project_state ENABLE ROW LEVEL SECURITY;

-- Policies for project_state table checking project ownership
CREATE POLICY "Users can view project_state for their own projects" 
ON public.project_state 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_state.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert project_state for their own projects" 
ON public.project_state 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_state.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update project_state for their own projects" 
ON public.project_state 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_state.project_id 
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_state.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete project_state for their own projects" 
ON public.project_state 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = project_state.project_id 
        AND projects.user_id = auth.uid()
    )
);

-- Trigger function to automatically create project_state when a project is created
CREATE OR REPLACE FUNCTION public.handle_new_project_state()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.project_state (project_id, context_markdown)
    VALUES (
        NEW.id,
        '# Project Context: ' || NEW.name || E'\n\n## Deskripsi\n(Masukkan deskripsi proyek di sini)\n\n## Teknologi Utama\n- (Masukkan daftar teknologi utama di sini)\n\n## Arsitektur & Aturan\n- (Masukkan aturan arsitektur di sini)\n\n## Status Terakhir\n- Project diinisialisasi.'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition on projects table
CREATE OR REPLACE TRIGGER on_project_created
    AFTER INSERT ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_project_state();
