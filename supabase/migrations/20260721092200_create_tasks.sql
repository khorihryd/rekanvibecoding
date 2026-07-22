-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    spec_markdown TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'inbox', 'in_progress', 'awaiting_review', 'revision', 'approved', 'rejected', 'merged')),
    branch_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks table checking project ownership
CREATE POLICY "Users can view tasks for their own projects" 
ON public.tasks 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert tasks for their own projects" 
ON public.tasks 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update tasks for their own projects" 
ON public.tasks 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete tasks for their own projects" 
ON public.tasks 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = tasks.project_id 
        AND projects.user_id = auth.uid()
    )
);
