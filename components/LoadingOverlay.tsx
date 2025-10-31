import { Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  message?: string;
  subtitle?: string;
}

export default function LoadingOverlay({
  message = "Loading...",
  subtitle,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/85 z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-foreground/70 animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-medium text-foreground mb-1">{message}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
