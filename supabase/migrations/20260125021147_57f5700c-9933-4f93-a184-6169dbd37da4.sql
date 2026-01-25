-- Create templates table for pre-built starter templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'saas', 'portfolio', 'ecommerce', 'landing', 'dashboard', 'blog'
  thumbnail_url TEXT,
  prompt TEXT NOT NULL, -- The prompt to generate this template
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project history table for saved projects
CREATE TABLE public.project_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  project_type TEXT NOT NULL, -- 'landing', 'webapp', 'native'
  thumbnail_url TEXT,
  preview_html TEXT, -- Stored HTML for quick preview
  files JSONB DEFAULT '[]', -- Array of generated files
  original_prompt TEXT NOT NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_history ENABLE ROW LEVEL SECURITY;

-- Templates are publicly readable (no auth needed to browse)
CREATE POLICY "Templates are publicly readable"
ON public.templates
FOR SELECT
USING (true);

-- Project history policies - users can only see their own projects
CREATE POLICY "Users can view their own projects"
ON public.project_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.project_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.project_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
ON public.project_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_project_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_project_history_updated_at
BEFORE UPDATE ON public.project_history
FOR EACH ROW
EXECUTE FUNCTION public.update_project_history_updated_at();

-- Insert default templates
INSERT INTO public.templates (name, description, category, prompt, tags, is_featured) VALUES
('SaaS Landing Page', 'Modern SaaS product landing page with hero, features, pricing, and CTA sections', 'saas', 'Create a modern SaaS landing page with a hero section featuring a headline and CTA button, a features grid showing 6 key features with icons, a pricing section with 3 tiers, customer testimonials, and a final CTA section. Use a professional blue and white color scheme.', ARRAY['saas', 'startup', 'product'], true),
('Portfolio Website', 'Creative portfolio for designers and developers with project showcase', 'portfolio', 'Create a creative portfolio website with an about me hero section, a projects grid showing 6 portfolio items with hover effects, a skills section, contact form, and social links. Use a dark theme with accent colors.', ARRAY['portfolio', 'creative', 'personal'], true),
('E-commerce Store', 'Online store landing page with product grid and shopping features', 'ecommerce', 'Create an e-commerce landing page with a hero banner featuring a sale, a product grid showing 8 products with prices and add to cart buttons, category navigation, and a newsletter signup. Use a clean white design with accent colors.', ARRAY['shop', 'store', 'products'], true),
('Restaurant Landing', 'Restaurant website with menu, reservations, and location', 'landing', 'Create a restaurant landing page with a hero section featuring the restaurant name and ambiance photo, a menu section with appetizers, mains, and desserts, a reservations form, gallery section, and location map. Use warm colors.', ARRAY['food', 'restaurant', 'local'], false),
('Dashboard UI', 'Admin dashboard with stats, charts, and data tables', 'dashboard', 'Create an admin dashboard with a sidebar navigation, top stats cards showing key metrics, a main chart area, a recent activity list, and a data table. Use a dark theme with colored accent cards.', ARRAY['admin', 'analytics', 'data'], true),
('Blog Template', 'Modern blog with featured posts and article cards', 'blog', 'Create a blog landing page with a featured post hero, a grid of article cards with thumbnails and excerpts, category filters, a newsletter signup, and an about the author sidebar. Use a clean, readable design.', ARRAY['blog', 'content', 'articles'], false);