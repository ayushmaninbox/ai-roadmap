"use client";

import { Trash2, Calendar, GitBranch } from "lucide-react";
import Link from "next/link";
import { RoadmapMetadata } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface RoadmapCardProps {
  roadmap: RoadmapMetadata;
  onDelete: (id: string) => void;
}

export default function RoadmapCard({ roadmap, onDelete }: RoadmapCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Delete roadmap "${roadmap.title}"?`)) {
      onDelete(roadmap.id);
    }
  };

  return (
    <Link href={`/roadmap/${roadmap.id}`}>
      <div className="group cursor-pointer relative">
        <Card className="relative bg-white hover:shadow-sm transition-shadow border rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <button
              onClick={handleDelete}
              className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-md transition-opacity z-10"
              aria-label="Delete roadmap"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                  <GitBranch className="w-5 h-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground group-hover:text-foreground pr-8 line-clamp-2 mb-0.5">
                    {roadmap.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {roadmap.nodeCount} topics
                  </p>
                  {roadmap.completedCount !== undefined &&
                    roadmap.totalResources !== undefined &&
                    roadmap.totalResources > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            Progress
                          </span>
                          <span className="text-[10px] font-medium text-foreground">
                            {roadmap.completedCount} of {roadmap.totalResources}{" "}
                            resources
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1">
                          <div
                            className="bg-gray-900 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                roadmap.totalResources > 0
                                  ? (roadmap.completedCount /
                                      roadmap.totalResources) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1 text-right">
                          {Math.round(
                            roadmap.totalResources > 0
                              ? (roadmap.completedCount /
                                  roadmap.totalResources) *
                                  100
                              : 0
                          )}
                          %
                        </div>
                      </div>
                    )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(roadmap.createdAt)}</span>
              </div>

              <div className="pt-2">
                <span className="inline-block px-2.5 py-1 bg-accent text-accent-foreground text-[11px] font-medium rounded-full border">
                  {roadmap.topic}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Link>
  );
}
