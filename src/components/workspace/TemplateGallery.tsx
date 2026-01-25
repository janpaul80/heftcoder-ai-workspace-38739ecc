import { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  User, 
  Rocket, 
  FileText, 
  Globe,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTemplates, type Template } from '@/hooks/useTemplates';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Globe },
  { id: 'saas', label: 'SaaS', icon: Rocket },
  { id: 'portfolio', label: 'Portfolio', icon: User },
  { id: 'ecommerce', label: 'E-commerce', icon: ShoppingBag },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'blog', label: 'Blog', icon: FileText },
];

const CATEGORY_COLORS: Record<string, string> = {
  saas: 'from-blue-500/20 to-indigo-500/20',
  portfolio: 'from-purple-500/20 to-pink-500/20',
  ecommerce: 'from-green-500/20 to-emerald-500/20',
  dashboard: 'from-orange-500/20 to-amber-500/20',
  blog: 'from-cyan-500/20 to-teal-500/20',
  landing: 'from-red-500/20 to-rose-500/20',
};

const CATEGORY_ICONS: Record<string, typeof Rocket> = {
  saas: Rocket,
  portfolio: User,
  ecommerce: ShoppingBag,
  dashboard: LayoutDashboard,
  blog: FileText,
  landing: Globe,
};

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
}

export function TemplateGallery({ onSelectTemplate }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { data: templates, isLoading } = useTemplates(selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "gap-2",
                selectedCategory === category.id 
                  ? "bg-primary text-primary-foreground" 
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {category.label}
            </Button>
          );
        })}
      </div>

      {/* Template grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => {
            const CategoryIcon = CATEGORY_ICONS[template.category] || Globe;
            const gradientClass = CATEGORY_COLORS[template.category] || 'from-gray-500/20 to-slate-500/20';
            
            return (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template)}
                className="group relative p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
              >
                {/* Thumbnail placeholder */}
                <div className={cn(
                  "h-28 rounded-lg mb-4 flex items-center justify-center bg-gradient-to-br",
                  gradientClass
                )}>
                  <CategoryIcon className="h-10 w-10 text-muted-foreground/50" />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    {template.is_featured && (
                      <Badge variant="outline" className="shrink-0 text-xs bg-primary/10 text-primary border-primary/30">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                </div>

                {/* Hover arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No templates found in this category
        </div>
      )}
    </div>
  );
}
