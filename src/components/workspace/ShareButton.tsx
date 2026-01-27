import { useState } from 'react';
import { Users, Globe, Link2, Check, ChevronDown, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Collaborator {
  id: string;
  email: string;
  name?: string;
  role: 'owner' | 'editor' | 'viewer';
  avatarColor: string;
}

interface ShareButtonProps {
  projectName?: string;
  currentUserEmail?: string;
}

export function ShareButton({ 
  projectName = 'My Project',
  currentUserEmail = 'paulhartmann605@gmail.com'
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [inviteLinkStatus, setInviteLinkStatus] = useState<'enabled' | 'disabled'>('disabled');
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    {
      id: '1',
      email: currentUserEmail,
      name: "paul's Lovable",
      role: 'owner',
      avatarColor: 'bg-primary',
    },
  ]);

  const handleAddPeople = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    const newCollab: Collaborator = {
      id: Date.now().toString(),
      email: email.trim(),
      role: 'editor',
      avatarColor: 'bg-blue-500',
    };
    
    setCollaborators([...collaborators, newCollab]);
    setEmail('');
    toast.success(`Invitation sent to ${email}`);
  };

  const handleRoleChange = (id: string, newRole: 'editor' | 'viewer') => {
    setCollaborators(collaborators.map(c => 
      c.id === id ? { ...c, role: newRole } : c
    ));
    toast.success('Role updated');
  };

  const handleCreateInviteLink = () => {
    const link = `https://heftcoder.icu/invite/${Math.random().toString(36).substring(2, 10)}`;
    setInviteLink(link);
    setInviteLinkStatus('enabled');
    toast.success('Invite link created');
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDisableLink = () => {
    setInviteLinkStatus('disabled');
    setInviteLink(null);
    toast.success('Invite link disabled');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            P
          </div>
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Share project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add people input */}
          <form onSubmit={handleAddPeople}>
            <Input
              placeholder="Add people"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border"
            />
          </form>

          {/* Project access section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Project access</h4>
            
            {/* People you invited */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">People you invited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {collaborators.slice(0, 3).map((c) => (
                    <div 
                      key={c.id}
                      className={`w-6 h-6 rounded-full ${c.avatarColor} flex items-center justify-center text-[10px] font-bold text-white border-2 border-card`}
                    >
                      {c.email[0].toUpperCase()}
                    </div>
                  ))}
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Collaborator list */}
            {collaborators.map((collaborator) => (
              <div key={collaborator.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${collaborator.avatarColor} flex items-center justify-center text-[10px] font-bold text-white`}>
                    {collaborator.email[0].toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    {collaborator.name && (
                      <span className="text-sm text-foreground">{collaborator.name}</span>
                    )}
                    <span className={`text-sm ${collaborator.name ? 'text-muted-foreground' : 'text-foreground'}`}>
                      {collaborator.email}
                      {collaborator.role === 'owner' && ' (you)'}
                    </span>
                  </div>
                </div>
                
                {collaborator.role === 'owner' ? (
                  <span className="text-sm text-muted-foreground">Owner</span>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1">
                        <span className="text-sm">Can {collaborator.role === 'editor' ? 'edit' : 'view'}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={() => handleRoleChange(collaborator.id, 'editor')}>
                        Can edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(collaborator.id, 'viewer')}>
                        Can view
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}

            {/* Invite link */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">Invite link</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-1">
                    <span className="text-sm capitalize">{inviteLinkStatus}</span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <DropdownMenuItem onClick={handleCreateInviteLink}>
                    Enabled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDisableLink}>
                    Disabled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Create invite link button */}
            {!inviteLink && (
              <Button
                variant="outline"
                className="w-full border-border"
                onClick={handleCreateInviteLink}
              >
                Create invite link
              </Button>
            )}

            {/* Show invite link if created */}
            {inviteLink && (
              <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                <span className="text-xs text-muted-foreground truncate flex-1">{inviteLink}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLink}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Bottom action buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-border gap-2"
              onClick={() => {
                toast.info('Preview link copied');
              }}
            >
              <Globe className="h-4 w-4" />
              Share preview
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 gap-2"
              onClick={() => {
                setOpen(false);
                toast.info('Opening publish dialog...');
              }}
            >
              <Globe className="h-4 w-4" />
              Publish project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
