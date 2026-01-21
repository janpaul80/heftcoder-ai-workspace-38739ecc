import { useState } from 'react';
import { X, Folder, File, ChevronRight, ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

// Mock file structure for demo
const mockFileTree: FileNode[] = [
  {
    name: 'src',
    type: 'folder',
    children: [
      {
        name: 'components',
        type: 'folder',
        children: [
          { name: 'Header.tsx', type: 'file' },
          { name: 'Footer.tsx', type: 'file' },
          { name: 'Button.tsx', type: 'file' },
        ],
      },
      {
        name: 'pages',
        type: 'folder',
        children: [
          { name: 'index.tsx', type: 'file' },
          { name: 'about.tsx', type: 'file' },
        ],
      },
      { name: 'App.tsx', type: 'file' },
      { name: 'main.tsx', type: 'file' },
    ],
  },
  {
    name: 'public',
    type: 'folder',
    children: [
      { name: 'favicon.ico', type: 'file' },
      { name: 'robots.txt', type: 'file' },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
  { name: 'README.md', type: 'file' },
];

interface FileTreeNodeProps {
  node: FileNode;
  depth: number;
}

function FileTreeNode({ node, depth }: FileTreeNodeProps) {
  const [isOpen, setIsOpen] = useState(depth === 0);

  if (node.type === 'file') {
    return (
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-secondary rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <File className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-foreground truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-secondary rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
        <Folder className={cn(
          "w-4 h-4 shrink-0",
          isOpen ? "text-primary" : "text-muted-foreground"
        )} />
        <span className="text-sm text-foreground truncate">{node.name}</span>
      </div>
      {isOpen && node.children && (
        <div>
          {node.children.map((child, index) => (
            <FileTreeNode key={`${child.name}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface FileExplorerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileExplorerModal({ open, onOpenChange }: FileExplorerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            File Explorer
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-0.5">
            {mockFileTree.map((node, index) => (
              <FileTreeNode key={`${node.name}-${index}`} node={node} depth={0} />
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
