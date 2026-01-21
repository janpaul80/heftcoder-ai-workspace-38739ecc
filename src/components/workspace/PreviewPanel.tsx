import hcIcon from '@/assets/hc-icon.png';
import type { ProjectStatus } from '@/types/workspace';

interface PreviewPanelProps {
  status: ProjectStatus;
  previewUrl?: string;
}

function WorkingIndicator() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Logo with glow */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-150 animate-pulse-subtle" />
        <img
          src={hcIcon}
          alt="HeftCoder"
          className="relative w-24 h-24 rounded-2xl animate-pulse-glow status-glow"
        />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-2">
        <span className="text-xl font-medium text-foreground">HeftCoder working</span>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function IdleState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      {/* Logo */}
      <div className="mb-6 opacity-60">
        <img
          src={hcIcon}
          alt="HeftCoder"
          className="w-20 h-20 rounded-2xl"
        />
      </div>

      {/* Text */}
      <p className="text-lg text-muted-foreground text-center max-w-md">
        Your project preview will appear here once generation starts
      </p>
    </div>
  );
}

function LivePreview({ url }: { url: string }) {
  return (
    <div className="h-full w-full">
      <iframe
        src={url}
        title="Project Preview"
        className="w-full h-full border-0 rounded-lg"
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}

function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-destructive text-lg font-medium mb-2">
        Something went wrong
      </div>
      {message && (
        <p className="text-muted-foreground text-sm">{message}</p>
      )}
    </div>
  );
}

export function PreviewPanel({ status, previewUrl }: PreviewPanelProps) {
  return (
    <div className="h-full bg-workspace-bg p-4">
      <div className="h-full rounded-lg border border-border bg-card overflow-hidden">
        {status.status === 'idle' && <IdleState />}
        {status.status === 'working' && <WorkingIndicator />}
        {status.status === 'complete' && previewUrl && <LivePreview url={previewUrl} />}
        {status.status === 'error' && <ErrorState message={status.message} />}
      </div>
    </div>
  );
}
