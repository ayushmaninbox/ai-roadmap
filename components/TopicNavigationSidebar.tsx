"use client";

import { CheckCircle2, Circle, ChevronRight, ChevronDown } from "lucide-react";
import { RoadmapNode } from "@/lib/types";
import type { Edge } from "reactflow";
import { useState, useEffect, useRef, useMemo } from "react";

interface TopicNavigationSidebarProps {
  nodes: RoadmapNode[];
  currentNodeId: string | null;
  completedResources: Record<string, Set<string>>; // { [nodeId]: Set<resourceId> }
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
  completedResources,
  onNodeSelect,
  edges = [],
}: TopicNavigationSidebarProps) {
  // Initialize all nodes as expanded by default
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const allExpanded = new Set<string>();
    nodes.forEach((node) => allExpanded.add(node.id));
    return allExpanded;
  });

  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Memoize tree to avoid rebuilding on every render
  const tree = useMemo(() => buildTree(nodes, edges), [nodes, edges]);

  // Function to get all parent node IDs for a given node
  const findParents = (
    currentNodes: TreeNode[],
    targetId: string,
    path: string[] = []
  ): string[] | null => {
    for (const treeNode of currentNodes) {
      if (treeNode.node.id === targetId) {
        return path;
      }
      const found = findParents(treeNode.children, targetId, [
        ...path,
        treeNode.node.id,
      ]);
      if (found) {
        return found;
      }
    }
    return null;
  };

  const getParentNodeIds = (
    nodeId: string,
    treeNodes: TreeNode[]
  ): string[] => {
    const path = findParents(treeNodes, nodeId);
    return path || [];
  };

  // Auto-expand parent nodes when a node is selected
  useEffect(() => {
    if (currentNodeId) {
      const parentIds = getParentNodeIds(currentNodeId, tree);
      setExpandedNodes((prev) => {
        const newExpanded = new Set(prev);
        parentIds.forEach((id) => newExpanded.add(id));
        newExpanded.add(currentNodeId);
        return newExpanded;
      });

      // Scroll to the selected node
      setTimeout(() => {
        const nodeElement = nodeRefs.current.get(currentNodeId);
        if (nodeElement) {
          nodeElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    }
  }, [currentNodeId, tree]);

  // Update expanded nodes when nodes change
  useEffect(() => {
    setExpandedNodes((prev) => {
      const newExpanded = new Set(prev);
      nodes.forEach((node) => {
        if (!newExpanded.has(node.id)) {
          newExpanded.add(node.id);
        }
      });
      return newExpanded;
    });
  }, [nodes]);

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  // Check if all resources for a node are completed
  const isNodeCompleted = (node: RoadmapNode): boolean => {
    const nodeResources = node.data.resources || [];
    if (nodeResources.length === 0) return false;

    const completedResourceIds =
      completedResources[node.id] || new Set<string>();
    // All resources must be completed
    return nodeResources.every((resource) =>
      completedResourceIds.has(resource.id)
    );
  };

  // Calculate total completed resources and total resources
  // We estimate that each node will have ~5 resources (as per API)
  // If resources have been fetched, use actual count, otherwise estimate
  const getProgressStats = () => {
    let totalResources = 0;
    let completedCount = 0;
    const ESTIMATED_RESOURCES_PER_NODE = 5;

    nodes.forEach((node) => {
      const nodeResources = node.data.resources || [];
      const nodeResourceCount = nodeResources.length;

      // If resources have been fetched, use actual count
      // Otherwise, estimate based on typical resource count per node
      if (node.data.resourcesFetched && nodeResourceCount > 0) {
        totalResources += nodeResourceCount;
      } else {
        // Estimate: most nodes have ~5 resources
        totalResources += ESTIMATED_RESOURCES_PER_NODE;
      }

      // Count completed resources (only for fetched nodes)
      if (nodeResourceCount > 0) {
        const completedResourceIds =
          completedResources[node.id] || new Set<string>();
        completedCount += nodeResources.filter((resource) =>
          completedResourceIds.has(resource.id)
        ).length;
      }
    });

    return { totalResources, completedCount };
  };

  const progressStats = getProgressStats();

  const renderTreeNode = (treeNode: TreeNode, depth: number = 0) => {
    const { node, children } = treeNode;
    const isActive = node.id === currentNodeId;
    const isCompleted = isNodeCompleted(node);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div
        key={node.id}
        ref={(el) => {
          if (el) {
            nodeRefs.current.set(node.id, el);
          } else {
            nodeRefs.current.delete(node.id);
          }
        }}
      >
        <button
          onClick={() => onNodeSelect(node.id)}
          className={`
            w-full text-left px-4 py-3 flex items-center gap-3 transition-all
            ${
              isActive
                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                : isCompleted
                ? "bg-green-50 hover:bg-green-100 border-l-2 border-green-300"
                : "hover:bg-gray-50"
            }
            ${depth > 0 && !isCompleted ? "border-l-2 border-gray-200" : ""}
          `}
          style={{ paddingLeft: `${depth * 24 + 16}px` }}
        >
          <div className="shrink-0">
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
                  isActive
                    ? "text-white/80"
                    : isCompleted
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {node.data.order}
              </span>
              <h4
                className={`font-medium text-sm truncate ${
                  isActive
                    ? "text-white"
                    : isCompleted
                    ? "text-green-700"
                    : "text-gray-900"
                }`}
              >
                {node.data.label}
              </h4>
            </div>
            <p
              className={`text-xs ${
                isActive
                  ? "text-white/70"
                  : isCompleted
                  ? "text-green-600"
                  : "text-gray-500"
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
          {progressStats.completedCount} of {progressStats.totalResources}{" "}
          resources completed
        </p>
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
          <div
            className="bg-gray-900 h-1.5 rounded-full transition-all duration-300"
            style={{
              width: `${
                progressStats.totalResources > 0
                  ? (progressStats.completedCount /
                      progressStats.totalResources) *
                    100
                  : 0
              }%`,
            }}
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
