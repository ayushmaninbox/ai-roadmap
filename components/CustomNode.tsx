import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { RoadmapNodeData } from '@/lib/types';
import { cn } from '@/lib/utils';

const CustomNode = memo(({ data, selected }: NodeProps<RoadmapNodeData>) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'fundamentals':
        return 'from-blue-500 to-cyan-500 text-white';
      case 'intermediate':
        return 'from-cyan-500 to-emerald-500 text-white';
      case 'advanced':
        return 'from-emerald-500 to-teal-500 text-white';
      case 'tools':
        return 'from-amber-500 to-orange-500 text-white';
      case 'practice':
        return 'from-pink-500 to-rose-500 text-white';
      case 'projects':
        return 'from-violet-500 to-purple-500 text-white';
      default:
        return 'from-gray-500 to-slate-500 text-white';
    }
  };

  const categoryColor = getCategoryColor(data.category);

  return (
    <div className="relative group">
      <div className={cn(
        'absolute inset-0 rounded-2xl blur-md opacity-0 group-hover:opacity-60 transition-all duration-300',
        `bg-gradient-to-r ${categoryColor.split(' ')[0]} ${categoryColor.split(' ')[1]}`
      )} />
      <div
        className={cn(
          'relative px-5 py-4 rounded-2xl border-2 shadow-lg transition-all duration-300 min-w-[200px] max-w-[240px] backdrop-blur-sm',
          `bg-gradient-to-r ${categoryColor}`,
          selected && 'ring-4 ring-white ring-offset-2 shadow-2xl scale-110 z-50'
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-white shadow-md"
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
              #{data.order}
            </span>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full capitalize">
              L{data.level}
            </span>
          </div>

          <h3 className="font-bold text-sm leading-tight">
            {data.label}
          </h3>

          <p className="text-xs opacity-90 capitalize font-medium">
            {data.category}
          </p>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-white shadow-md"
        />
      </div>
    </div>
  );
});

CustomNode.displayName = 'CustomNode';

export default CustomNode;
