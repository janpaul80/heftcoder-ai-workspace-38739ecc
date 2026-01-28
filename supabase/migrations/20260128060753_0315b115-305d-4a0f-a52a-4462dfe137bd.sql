-- Create published_projects table to track deployed landing pages
CREATE TABLE public.published_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  html_content TEXT NOT NULL,
  original_prompt TEXT,
  project_type TEXT DEFAULT 'landing',
  is_public BOOLEAN DEFAULT true,
  visitor_count INTEGER DEFAULT 0,
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on slug for fast lookups
CREATE INDEX idx_published_projects_slug ON public.published_projects(slug);
CREATE INDEX idx_published_projects_user_id ON public.published_projects(user_id);

-- Enable Row Level Security
ALTER TABLE public.published_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public projects (for serving published pages)
CREATE POLICY "Anyone can view public projects" 
ON public.published_projects 
FOR SELECT 
USING (is_public = true);

-- Policy: Users can view their own projects (public or private)
CREATE POLICY "Users can view their own projects" 
ON public.published_projects 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Users can create their own projects
CREATE POLICY "Users can create their own projects" 
ON public.published_projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update their own projects" 
ON public.published_projects 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete their own projects" 
ON public.published_projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_published_projects_updated_at
BEFORE UPDATE ON public.published_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_project_history_updated_at();