-- Create updated_at function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create planning_jobs table for async job processing
CREATE TABLE public.planning_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  prompt TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'clarifying', 'awaiting_approval', 'complete', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0,
  plan JSONB,
  clarifying_questions JSONB,
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.planning_jobs ENABLE ROW LEVEL SECURITY;

-- Allow all users to insert (anonymous users can create jobs too)
CREATE POLICY "Anyone can create planning jobs"
ON public.planning_jobs
FOR INSERT
WITH CHECK (true);

-- Allow all users to read their own jobs or anonymous jobs
CREATE POLICY "Anyone can read their own or anonymous jobs"
ON public.planning_jobs
FOR SELECT
USING (user_id IS NULL OR user_id = auth.uid());

-- Allow updates to jobs (for background processing)
CREATE POLICY "Anyone can update their own or anonymous jobs"
ON public.planning_jobs
FOR UPDATE
USING (user_id IS NULL OR user_id = auth.uid());

-- Create updated_at trigger
CREATE TRIGGER update_planning_jobs_updated_at
BEFORE UPDATE ON public.planning_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for polling
ALTER PUBLICATION supabase_realtime ADD TABLE public.planning_jobs;