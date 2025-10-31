import { AlertCircle } from "lucide-react";

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-md mb-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">
          Something went wrong
        </h3>
        <p className="text-xs text-muted-foreground mb-3">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-2 bg-gray-900 text-white rounded-md text-xs font-medium"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
