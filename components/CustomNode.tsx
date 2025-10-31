import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { RoadmapNodeData } from "@/lib/types";
import { cn } from "@/lib/utils";

const CustomNode = memo(({ data, selected }: NodeProps<RoadmapNodeData>) => {
  const categoryAccent = getCategoryAccent(data.category);

  return (
    <div className="relative">
      <div
        className={cn(
          "relative px-4 py-3 rounded-lg border bg-white transition-colors min-w-[200px] max-w-[260px]",
          selected && "ring-2 ring-gray-900"
        )}
      >
        <Handle
          type="target"
          position={Position.Top}
          className="w-2.5 h-2.5 !bg-gray-900"
        />

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-[10px] font-medium text-white px-1.5 py-0.5 rounded-sm"
              style={{ backgroundColor: categoryAccent }}
            >
              {data.category}
            </span>
            <span className="text-[10px] text-foreground/60">
              L{data.level}
            </span>
          </div>

          <h3 className="font-medium text-sm leading-snug text-foreground">
            {data.label}
          </h3>

          <p className="text-[11px] text-foreground/60">#{data.order}</p>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          className="w-2.5 h-2.5 !bg-gray-900"
        />
      </div>
    </div>
  );
});

function getCategoryAccent(category: string): string {
  switch (category) {
    case "fundamentals":
      return "#111827";
    case "intermediate":
      return "#1f2937";
    case "advanced":
      return "#374151";
    case "tools":
      return "#4b5563";
    case "practice":
      return "#6b7280";
    case "projects":
      return "#9ca3af";
    default:
      return "#111827";
  }
}

CustomNode.displayName = "CustomNode";

export default CustomNode;
