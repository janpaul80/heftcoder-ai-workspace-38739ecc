-- Add SEO fields for per-project share previews
ALTER TABLE public.published_projects
ADD COLUMN seo_title text,
ADD COLUMN seo_description text;