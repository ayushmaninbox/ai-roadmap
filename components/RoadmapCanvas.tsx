"use client";

import { useCallback, useMemo, useEffect } from "react";
import ReactFlow, {
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import CustomNode from "./CustomNode";
import { RoadmapNodeData } from "@/lib/types";

interface RoadmapCanvasProps {
  nodes: Node<RoadmapNodeData>[];
  edges: Edge[];
  onNodeClick?: (node: Node<RoadmapNodeData>) => void;
}

export default function RoadmapCanvas({
  nodes,
  edges,
  onNodeClick,
}: RoadmapCanvasProps) {
  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Sync nodes and edges when props change
  useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  // Register custom node type
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  // Handle node click
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      if (onNodeClick) {
        onNodeClick(node as Node<RoadmapNodeData>);
      }
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={1.5}
        defaultEdgeOptions={{
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={1}
          color="#e2e8f0"
        />
        <Controls
          showInteractive={false}
          className="bg-white border border-gray-300 rounded-md shadow-md"
        />
      </ReactFlow>
    </div>
  );
}
