"use client";

import { CheckCircle2, Circle, ChevronRight, ChevronDown } from "lucide-react";
import { RoadmapNode } from "@/lib/types";
import type { Edge } from "reactflow";
import { useState } from "react";

interface TopicNavigationSidebarProps {
  nodes: RoadmapNode[];
  currentNodeId: string | null;
  completedNodes: Set<string>;
  onNodeSelect: (nodeId: string) => void;
  edges?: Edge[];
}

interface TreeNode {
  node: RoadmapNode;
  children: TreeNode[];
}

export default function TopicNavigationSidebar({
  nodes,
  currentNodeId,
  completedNodes,
  onNodeSelect,
  edges = [],
}: TopicNavigationSidebarProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const tree = buildTree(nodes, edges);

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderTreeNode = (treeNode: TreeNode, depth: number = 0) => {
    const { node, children } = treeNode;
    const isActive = node.id === currentNodeId;
    const isCompleted = completedNodes.has(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id) || depth === 0;

    return (
      <div key={node.id}>
        <button
          onClick={() => onNodeSelect(node.id)}
          className={`
            w-full text-left px-4 py-3 flex items-center gap-3 transition-all
            ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                : "hover:bg-gray-50"
            }
            ${depth > 0 ? "border-l-2 border-gray-200" : ""}
          `}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="flex-shrink-0">
            {isCompleted ? (
              <CheckCircle2
                className={`w-5 h-5 ${
                  isActive ? "text-white" : "text-green-500"
                }`}
              />
            ) : (
              <Circle
                className={`w-5 h-5 ${
                  isActive ? "text-white" : "text-gray-400"
                }`}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-white/80" : "text-gray-500"
                }`}
              >
                {node.data.order}
              </span>
              <h4
                className={`font-medium text-sm truncate ${
                  isActive ? "text-white" : "text-gray-900"
                }`}
              >
                {node.data.label}
              </h4>
            </div>
            <p
              className={`text-xs ${
                isActive ? "text-white/70" : "text-gray-500"
              } capitalize`}
            >
              {node.data.category}
            </p>
          </div>

          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(node.id);
              }}
              className={`p-1 rounded hover:bg-white/20 transition-colors ${
                isActive ? "text-white" : "text-gray-400"
              }`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="font-semibold text-sm text-gray-900">Learning path</h2>
        <p className="text-xs text-gray-600 mt-1">
          {completedNodes.size} of {nodes.length} completed
        </p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
          <div
            className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(completedNodes.size / nodes.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tree.map((treeNode) => renderTreeNode(treeNode))}
      </div>
    </div>
  );
}

function buildTree(nodes: RoadmapNode[], edges: Edge[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>();
  const childToParentIds = new Map<string, Set<string>>();

  nodes.forEach((node) => {
    nodeMap.set(node.id, { node, children: [] });
  });

  edges.forEach((edge) => {
    const targetId = String(edge.target);
    const sourceId = String(edge.source);
    if (!childToParentIds.has(targetId))
      childToParentIds.set(targetId, new Set());
    childToParentIds.get(targetId)!.add(sourceId);
  });

  edges.forEach((edge) => {
    const parentTreeNode = nodeMap.get(String(edge.source));
    const childTreeNode = nodeMap.get(String(edge.target));
    if (parentTreeNode && childTreeNode) {
      parentTreeNode.children.push(childTreeNode);
    }
  });

  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    const hasIncoming =
      childToParentIds.has(node.id) && childToParentIds.get(node.id)!.size > 0;
    if (!hasIncoming) {
      const treeNode = nodeMap.get(node.id)!;
      roots.push(treeNode);
    }
  });

  const sortByLevelAndOrder = (a: TreeNode, b: TreeNode) => {
    if (a.node.data.level !== b.node.data.level)
      return a.node.data.level - b.node.data.level;
    return a.node.data.order - b.node.data.order;
  };

  roots.sort(sortByLevelAndOrder);
  nodeMap.forEach((treeNode) => {
    treeNode.children.sort(sortByLevelAndOrder);
  });

  return roots;
}
