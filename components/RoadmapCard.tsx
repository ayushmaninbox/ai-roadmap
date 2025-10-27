'use client';

import { Trash2, Calendar, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { RoadmapMetadata } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

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
      <Card className="group hover:shadow-lg transition-all duration-200 hover:border-blue-400 cursor-pointer relative">
        <CardContent className="p-5">
          {/* Delete button */}
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-full transition-all z-10"
            aria-label="Delete roadmap"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>

          {/* Card content */}
          <div className="space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors pr-8 line-clamp-2">
              {roadmap.title}
            </h3>

            {/* Metadata */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span>{roadmap.nodeCount} topics</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(roadmap.createdAt)}</span>
              </div>
            </div>

            {/* Topic badge */}
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {roadmap.topic}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
