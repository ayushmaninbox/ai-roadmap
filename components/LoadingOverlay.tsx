import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  subtitle?: string;
}

export default function LoadingOverlay({
  message = 'Loading...',
  subtitle,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
