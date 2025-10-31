"use client";

import {
  X,
  Video,
  FileText,
  BookOpen,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { RoadmapNodeData, Resource } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ResourceSidebarProps {
  nodeData: RoadmapNodeData | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export default function ResourceSidebar({
  nodeData,
  isOpen,
  isLoading,
  onClose,
}: ResourceSidebarProps) {
  if (!isOpen || !nodeData) return null;

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "youtube":
        return <Video className="w-4 h-4" />;
      case "documentation":
        return <BookOpen className="w-4 h-4" />;
      case "article":
      case "tutorial":
      case "course":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getResourceTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full md:w-[380px] bg-white border-l z-50",
          "transform transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-foreground leading-tight">
                {nodeData.label}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                  Level {nodeData.level}
                </span>
                <span className="text-[11px] px-2 py-0.5 bg-gray-900 text-white rounded capitalize">
                  {nodeData.category}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors shrink-0"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-foreground/70" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {nodeData.description}
            </p>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="text-xs font-medium text-foreground mb-2">
              Resources
            </h3>

            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-6 h-6 text-foreground/70 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Loading resources...
                  </p>
                </div>
              </div>
            )}

            {/* No resources state */}
            {!isLoading &&
              (!nodeData.resources || nodeData.resources.length === 0) && (
                <div className="py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    No resources available for this topic.
                  </p>
                </div>
              )}

            {/* Resources list */}
            {!isLoading &&
              nodeData.resources &&
              nodeData.resources.length > 0 && (
                <div className="space-y-2.5">
                  {nodeData.resources.map((resource: Resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 border rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-1">
                          <div className="p-2 bg-gray-100 rounded text-foreground/70">
                            {getResourceIcon(resource.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-medium text-foreground/70">
                              {getResourceTypeLabel(resource.type)}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">
                            {resource.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {resource.description}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span>{resource.source}</span>
                            {resource.type === "youtube" &&
                              resource.metadata &&
                              "duration" in resource.metadata &&
                              resource.metadata.duration && (
                                <>
                                  <span>•</span>
                                  <span>{resource.metadata.duration}</span>
                                </>
                              )}
                            {resource.type === "youtube" &&
                              resource.metadata &&
                              "views" in resource.metadata &&
                              resource.metadata.views && (
                                <>
                                  <span>•</span>
                                  <span>{resource.metadata.views} views</span>
                                </>
                              )}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-foreground/40 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
