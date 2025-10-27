import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RoadmapNodeData } from '@/lib/types';
import { cn } from '@/lib/utils';

const CustomNode = memo(({ data, selected }: NodeProps<RoadmapNodeData>) => {
  // Category-based styling
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fundamentals':
        return 'bg-blue-100 border-blue-400 text-blue-900';
      case 'advanced':
        return 'bg-purple-100 border-purple-400 text-purple-900';
      case 'tools':
        return 'bg-green-100 border-green-400 text-green-900';
      case 'practice':
        return 'bg-orange-100 border-orange-400 text-orange-900';
      case 'projects':
        return 'bg-red-100 border-red-400 text-red-900';
      case 'theory':
        return 'bg-indigo-100 border-indigo-400 text-indigo-900';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-900';
    }
  };

  const categoryColor = getCategoryColor(data.category);

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 shadow-md transition-all duration-200 min-w-[180px] max-w-[220px]',
        categoryColor,
        selected && 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
      )}
    >
      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400"
      />

      {/* Node content */}
      <div className="space-y-1">
        {/* Level badge */}
        <div className="text-xs font-medium opacity-70">
          Level {data.level}
        </div>

        {/* Node title */}
        <div className="font-semibold text-sm leading-tight">
          {data.label}
        </div>

        {/* Category badge */}
        <div className="text-xs opacity-70 capitalize">
          {data.category}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
