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
      <div className="group cursor-pointer relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-all duration-300" />
        <Card className="relative bg-white/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-300 border border-gray-200/50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <button
              onClick={handleDelete}
              className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-xl transition-all z-10 shadow-sm"
              aria-label="Delete roadmap"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <GitBranch className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-cyan-600 group-hover:bg-clip-text group-hover:text-transparent transition-all pr-8 line-clamp-2 mb-1">
                    {roadmap.title}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">{roadmap.nodeCount} topics to master</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(roadmap.createdAt)}</span>
              </div>

              <div className="pt-2">
                <span className="inline-block px-3 py-1.5 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 text-xs font-bold rounded-full border border-blue-200/50">
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
