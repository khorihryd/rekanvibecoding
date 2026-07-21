-- Create decisions table
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    decision_text TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    superseded_by UUID REFERENCES public.decisions(id) ON DELETE SET NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Policies for decisions table checking project ownership
CREATE POLICY "Users can view decisions for their own projects" 
ON public.decisions 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = decisions.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert decisions for their own projects" 
ON public.decisions 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = decisions.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update decisions for their own projects" 
ON public.decisions 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = decisions.project_id 
        AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = decisions.project_id 
        AND projects.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete decisions for their own projects" 
ON public.decisions 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.projects 
        WHERE projects.id = decisions.project_id 
        AND projects.user_id = auth.uid()
    )
);
