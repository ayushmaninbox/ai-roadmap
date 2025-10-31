'use client';

import { X, ExternalLink, Play, FileText, BookOpen, Loader2 } from 'lucide-react';
import { Resource } from '@/lib/types';
import { useState } from 'react';

interface EmbeddedResourceViewerProps {
  resource: Resource | null;
  onClose: () => void;
}

export default function EmbeddedResourceViewer({ resource, onClose }: EmbeddedResourceViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!resource) return null;

  const isYouTube = resource.type === 'youtube';
  const youtubeVideoId = isYouTube ? extractYouTubeVideoId(resource.url) : null;

  const getResourceIcon = () => {
    switch (resource.type) {
      case 'youtube':
        return <Play className="w-5 h-5" />;
      case 'documentation':
        return <BookOpen className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 bg-blue-500 text-white rounded-lg">
            {getResourceIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{resource.title}</h3>
            <p className="text-xs text-gray-500 capitalize">{resource.type} • {resource.source}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-5 h-5 text-gray-600" />
          </a>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading resource...</p>
            </div>
          </div>
        )}

        {isYouTube && youtubeVideoId ? (
          <iframe
            src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0&rel=0`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleIframeLoad}
            title={resource.title}
          />
        ) : (
          <iframe
            src={resource.url}
            className="w-full h-full"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onLoad={handleIframeLoad}
            title={resource.title}
          />
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <p className="text-sm text-gray-700 leading-relaxed">{resource.description}</p>
        {resource.type === 'youtube' && resource.metadata && 'duration' in resource.metadata && (
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {resource.metadata.duration && (
              <span>Duration: {resource.metadata.duration}</span>
            )}
            {resource.metadata.views && (
              <span>{resource.metadata.views} views</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
