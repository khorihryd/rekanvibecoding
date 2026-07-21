-- Create github_tokens table
CREATE TABLE IF NOT EXISTS public.github_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.github_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for github_tokens table
CREATE POLICY "Users can view their own github token" 
ON public.github_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own github token" 
ON public.github_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own github token" 
ON public.github_tokens 
FOR DELETE 
USING (auth.uid() = user_id);
