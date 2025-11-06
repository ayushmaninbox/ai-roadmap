"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Download,
  Maximize2,
  LayoutGrid,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import { Node, Edge } from "reactflow";
import RoadmapCanvas from "@/components/RoadmapCanvas";
import TopicNavigationSidebar from "@/components/TopicNavigationSidebar";
import EmbeddedResourceViewer from "@/components/EmbeddedResourceViewer";
import LoadingOverlay from "@/components/LoadingOverlay";
import ErrorMessage from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { getRoadmap, saveRoadmap, updateRoadmap } from "@/lib/storage";
import { Roadmap, RoadmapNodeData, Resource } from "@/lib/types";

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const topic = searchParams.get("topic");

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null
  );
  const [currentResourceIndex, setCurrentResourceIndex] = useState<number>(0);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [completedResources, setCompletedResources] = useState<
    Record<string, Set<string>>
  >({});
  const [showTreeView, setShowTreeView] = useState(true); // Start with mindmap visible
  const [sidebarWidth, setSidebarWidth] = useState(320); // Default width in pixels
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const loadRoadmap = async () => {
      if (id === "new" && topic) {
        await generateRoadmap(topic);
      } else {
        const existingRoadmap = getRoadmap(id);
        if (existingRoadmap) {
          setRoadmap(existingRoadmap);

          // Load completed resources from the roadmap
          if (existingRoadmap.completedResources) {
            const resourcesMap: Record<string, Set<string>> = {};
            Object.entries(existingRoadmap.completedResources).forEach(
              ([nodeId, resourceIds]) => {
                resourcesMap[nodeId] = new Set(resourceIds);
              }
            );
            setCompletedResources(resourcesMap);
          }

          // Restore last position if available
          if (existingRoadmap.lastPosition) {
            const { nodeId, resourceIndex } = existingRoadmap.lastPosition;
            const node = existingRoadmap.nodes.find((n) => n.id === nodeId);
            if (node) {
              setCurrentNodeId(nodeId);
              setCurrentResourceIndex(resourceIndex);
              setShowTreeView(false);

              // If resources are already fetched, restore the selected resource
              if (
                node.data.resourcesFetched &&
                node.data.resources &&
                node.data.resources.length > 0
              ) {
                const resource = node.data.resources[resourceIndex];
                if (resource) {
                  setSelectedResource(resource);
                } else {
                  // If index is out of bounds, use first resource
                  setSelectedResource(node.data.resources[0]);
                  setCurrentResourceIndex(0);
                }
              } else {
                // Fetch resources if not already fetched
                await fetchResourcesForNode(node, existingRoadmap);
                // After fetching, restore the correct resource index
                // We need to get the updated roadmap from state or wait for it
                const restoredRoadmap = getRoadmap(id);
                if (restoredRoadmap) {
                  const updatedNode = restoredRoadmap.nodes.find(
                    (n) => n.id === nodeId
                  );
                  if (
                    updatedNode?.data.resources &&
                    updatedNode.data.resources.length > 0
                  ) {
                    const restoreIndex = Math.min(
                      resourceIndex,
                      updatedNode.data.resources.length - 1
                    );
                    setCurrentResourceIndex(restoreIndex);
                    setSelectedResource(
                      updatedNode.data.resources[restoreIndex]
                    );
                  }
                }
              }
            }
          }

          setIsLoading(false);
        } else {
          setError("Roadmap not found");
          setIsLoading(false);
          setTimeout(() => {
            router.push("/");
          }, 2000);
        }
      }
    };

    loadRoadmap();
  }, [id, topic, router]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = 600;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  const generateRoadmap = async (topicToGenerate: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topicToGenerate }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate roadmap");
      }

      const newRoadmap = data.roadmap;
      // Initialize completedResources as empty object for new roadmaps
      if (!newRoadmap.completedResources) {
        newRoadmap.completedResources = {};
      }
      saveRoadmap(newRoadmap);
      setRoadmap(newRoadmap);
      // Start with mindmap view for new roadmaps too
      setShowTreeView(true);

      router.replace(`/roadmap/${newRoadmap.id}`);
      setIsLoading(false);
    } catch (err) {
      console.error("Error generating roadmap:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate roadmap"
      );
      setIsLoading(false);
    }
  };

  const fetchResourcesForNode = async (
    node: Node<RoadmapNodeData>,
    currentRoadmap: Roadmap
  ) => {
    if (node.data.resourcesFetched) {
      if (node.data.resources && node.data.resources.length > 0) {
        setSelectedResource(node.data.resources[0]);
        setCurrentResourceIndex(0);
      }
      return;
    }

    setIsLoadingResources(true);

    try {
      const response = await fetch("/api/fetch-resources", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nodeTitle: node.data.label,
          nodeTopic: currentRoadmap.topic,
          nodeDescription: node.data.description,
        }),
      });

      const data = await response.json();

      if (data.success && data.resources) {
        const updatedNodes = currentRoadmap.nodes.map((n) =>
          n.id === node.id
            ? {
                ...n,
                data: {
                  ...n.data,
                  resources: data.resources,
                  resourcesFetched: true,
                },
              }
            : n
        );

        const updatedRoadmap = {
          ...currentRoadmap,
          nodes: updatedNodes,
        };

        setRoadmap(updatedRoadmap);
        updateRoadmap(currentRoadmap.id, { nodes: updatedNodes });

        if (data.resources.length > 0) {
          setSelectedResource(data.resources[0]);
          setCurrentResourceIndex(0);
        }
      }
    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setIsLoadingResources(false);
    }
  };

  const handleNodeSelect = useCallback(
    async (nodeId: string) => {
      setCurrentNodeId(nodeId);
      setSelectedResource(null);
      setCurrentResourceIndex(0);
      // Hide mindmap when node is selected
      setShowTreeView(false);

      if (roadmap) {
        const node = roadmap.nodes.find((n) => n.id === nodeId);
        if (node) {
          await fetchResourcesForNode(node, roadmap);

          // Save position when node is selected
          const updatedRoadmap = {
            ...roadmap,
            lastPosition: {
              nodeId: nodeId,
              resourceIndex: 0,
            },
            updatedAt: new Date().toISOString(),
          };
          updateRoadmap(roadmap.id, updatedRoadmap);
        }
      }
    },
    [roadmap]
  );

  const handleMarkComplete = () => {
    if (currentNodeId && selectedResource && roadmap) {
      const currentNode = roadmap.nodes.find((n) => n.id === currentNodeId);
      if (!currentNode) return;

      // Get current completed resources for this node
      const nodeCompletedResources =
        completedResources[currentNodeId] || new Set<string>();
      const newCompleted = new Set(nodeCompletedResources);

      // Toggle completion for the current resource
      if (newCompleted.has(selectedResource.id)) {
        newCompleted.delete(selectedResource.id);
      } else {
        newCompleted.add(selectedResource.id);
      }

      // Update completed resources state
      const updatedCompletedResources = {
        ...completedResources,
        [currentNodeId]: newCompleted,
      };
      setCompletedResources(updatedCompletedResources);

      // Save completed resources to localStorage
      const completedResourcesForStorage: Record<string, string[]> = {};
      Object.entries(updatedCompletedResources).forEach(
        ([nodeId, resourceIds]) => {
          if (resourceIds.size > 0) {
            completedResourcesForStorage[nodeId] = Array.from(resourceIds);
          }
        }
      );

      // Also save current position
      const updatedRoadmap = {
        ...roadmap,
        completedResources: completedResourcesForStorage,
        lastPosition: {
          nodeId: currentNodeId,
          resourceIndex: currentResourceIndex,
        },
        updatedAt: new Date().toISOString(),
      };
      updateRoadmap(roadmap.id, updatedRoadmap);
      setRoadmap(updatedRoadmap);
    }
  };

  // Get DFS-ordered nodes
  const getDFSNodes = useCallback(
    (
      nodes: Node<RoadmapNodeData>[],
      edges: Edge[]
    ): Node<RoadmapNodeData>[] => {
      const nodeMap = new Map<string, Node<RoadmapNodeData>>();
      const childrenMap = new Map<string, string[]>();
      const roots: string[] = [];

      // Build node map and find roots
      nodes.forEach((node) => {
        nodeMap.set(node.id, node);
        childrenMap.set(node.id, []);
      });

      // Build children map
      edges.forEach((edge) => {
        const parentId = String(edge.source);
        const childId = String(edge.target);
        const children = childrenMap.get(parentId) || [];
        children.push(childId);
        childrenMap.set(parentId, children);
      });

      // Find root nodes (nodes with no incoming edges)
      nodes.forEach((node) => {
        const hasIncoming = edges.some((e) => String(e.target) === node.id);
        if (!hasIncoming) {
          roots.push(node.id);
        }
      });

      // DFS traversal
      const dfsOrder: Node<RoadmapNodeData>[] = [];
      const visited = new Set<string>();

      const dfs = (nodeId: string) => {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);

        const node = nodeMap.get(nodeId);
        if (node) {
          dfsOrder.push(node);
        }

        // Sort children by order for consistent traversal
        const children = childrenMap.get(nodeId) || [];
        const childNodes = children
          .map((id) => nodeMap.get(id))
          .filter((n): n is Node<RoadmapNodeData> => n !== undefined)
          .sort((a, b) => {
            if (a.data.level !== b.data.level) {
              return a.data.level - b.data.level;
            }
            return a.data.order - b.data.order;
          });

        childNodes.forEach((child) => {
          dfs(child.id);
        });
      };

      // Start DFS from each root, sorted by order
      const rootNodes = roots
        .map((id) => nodeMap.get(id))
        .filter((n): n is Node<RoadmapNodeData> => n !== undefined)
        .sort((a, b) => {
          if (a.data.level !== b.data.level) {
            return a.data.level - b.data.level;
          }
          return a.data.order - b.data.order;
        });

      rootNodes.forEach((root) => dfs(root.id));

      // If we have nodes that weren't visited (orphaned nodes), add them at the end
      nodes.forEach((node) => {
        if (!visited.has(node.id)) {
          dfsOrder.push(node);
        }
      });

      return dfsOrder;
    },
    []
  );

  const handleNextTopic = () => {
    if (!roadmap || !currentNodeId) return;

    const currentNode = roadmap.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) return;

    // Check if there are more resources for current node
    const resources = currentNode.data.resources || [];
    if (resources.length > 0 && currentResourceIndex < resources.length - 1) {
      // Move to next resource
      const nextResourceIndex = currentResourceIndex + 1;
      setCurrentResourceIndex(nextResourceIndex);
      setSelectedResource(resources[nextResourceIndex]);

      // Save position
      const updatedRoadmap = {
        ...roadmap,
        lastPosition: {
          nodeId: currentNodeId,
          resourceIndex: nextResourceIndex,
        },
        updatedAt: new Date().toISOString(),
      };
      updateRoadmap(roadmap.id, updatedRoadmap);
      return;
    }

    // All resources for current node are done, move to next node (DFS)
    const dfsNodes = getDFSNodes(roadmap.nodes, roadmap.edges);
    const currentIndex = dfsNodes.findIndex((n) => n.id === currentNodeId);

    if (currentIndex < dfsNodes.length - 1) {
      const nextNode = dfsNodes[currentIndex + 1];
      handleNodeSelect(nextNode.id);

      // Save position
      const updatedRoadmap = {
        ...roadmap,
        lastPosition: {
          nodeId: nextNode.id,
          resourceIndex: 0,
        },
        updatedAt: new Date().toISOString(),
      };
      updateRoadmap(roadmap.id, updatedRoadmap);
    }
  };

  const handlePreviousTopic = () => {
    if (!roadmap || !currentNodeId) return;

    const currentNode = roadmap.nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) return;

    // Check if we can go to previous resource
    const resources = currentNode.data.resources || [];
    if (currentResourceIndex > 0 && resources.length > 0) {
      // Move to previous resource
      const prevResourceIndex = currentResourceIndex - 1;
      setCurrentResourceIndex(prevResourceIndex);
      setSelectedResource(resources[prevResourceIndex]);

      // Save position
      const updatedRoadmap = {
        ...roadmap,
        lastPosition: {
          nodeId: currentNodeId,
          resourceIndex: prevResourceIndex,
        },
        updatedAt: new Date().toISOString(),
      };
      updateRoadmap(roadmap.id, updatedRoadmap);
      return;
    }

    // Move to previous node (DFS)
    const dfsNodes = getDFSNodes(roadmap.nodes, roadmap.edges);
    const currentIndex = dfsNodes.findIndex((n) => n.id === currentNodeId);

    if (currentIndex > 0) {
      const prevNode = dfsNodes[currentIndex - 1];
      const prevNodeResources = prevNode.data.resources || [];
      const prevResourceIndex =
        prevNodeResources.length > 0 ? prevNodeResources.length - 1 : 0;

      setCurrentNodeId(prevNode.id);
      setCurrentResourceIndex(prevResourceIndex);
      setShowTreeView(false);

      if (prevNodeResources.length > 0) {
        setSelectedResource(prevNodeResources[prevResourceIndex]);
      } else {
        setSelectedResource(null);
        // Fetch resources if not already fetched
        if (!prevNode.data.resourcesFetched) {
          fetchResourcesForNode(prevNode, roadmap);
        }
      }

      // Save position
      const updatedRoadmap = {
        ...roadmap,
        lastPosition: {
          nodeId: prevNode.id,
          resourceIndex: prevResourceIndex,
        },
        updatedAt: new Date().toISOString(),
      };
      updateRoadmap(roadmap.id, updatedRoadmap);
    }
  };

  const handleSave = () => {
    if (roadmap) {
      saveRoadmap(roadmap);
    }
  };

  const handleExport = () => {
    if (roadmap) {
      const dataStr = JSON.stringify(roadmap, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${roadmap.topic.replace(/\s+/g, "-")}-roadmap.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  if (isLoading) {
    return (
      <LoadingOverlay
        message="Generating your roadmap..."
        subtitle="This usually takes 3-5 seconds"
      />
    );
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => router.push("/")} />;
  }

  if (!roadmap) {
    return <ErrorMessage message="Roadmap not found" />;
  }

  const currentNode = roadmap.nodes.find((n) => n.id === currentNodeId);
  const dfsNodes = getDFSNodes(roadmap.nodes, roadmap.edges);
  const currentIndex = currentNodeId
    ? dfsNodes.findIndex((n) => n.id === currentNodeId)
    : -1;

  // Check if we can go next (either more resources or more nodes)
  const canGoNext =
    currentNodeId && currentNode
      ? (currentNode.data.resources || []).length > 0 &&
        currentResourceIndex < (currentNode.data.resources || []).length - 1
        ? true
        : currentIndex < dfsNodes.length - 1
      : false;

  // Check if we can go previous (either previous resource or previous node)
  const canGoPrevious =
    currentNodeId && currentNode
      ? currentResourceIndex > 0 &&
        (currentNode.data.resources || []).length > 0
        ? true
        : currentIndex > 0
      : false;

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              {roadmap.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {roadmap.nodeCount} topics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTreeView(!showTreeView)}
          >
            {showTreeView ? (
              <Maximize2 className="w-4 h-4 mr-2" />
            ) : (
              <LayoutGrid className="w-4 h-4 mr-2" />
            )}
            {showTreeView ? "Hide Tree" : "Show Tree"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Resizable Sidebar */}
        <div
          className={`relative transition-all duration-200 ${
            isSidebarCollapsed ? "w-0" : ""
          }`}
          style={{
            width: isSidebarCollapsed ? "0" : `${sidebarWidth}px`,
            minWidth: isSidebarCollapsed ? "0" : "200px",
            maxWidth: isSidebarCollapsed ? "0" : "600px",
          }}
        >
          <TopicNavigationSidebar
            nodes={roadmap.nodes}
            currentNodeId={currentNodeId}
            completedResources={completedResources}
            onNodeSelect={handleNodeSelect}
            edges={roadmap.edges}
          />

          {/* Resize Handle */}
          {!isSidebarCollapsed && (
            <div
              className="absolute right-0 top-0 w-1 h-full bg-gray-200 hover:bg-gray-300 cursor-col-resize group"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-16 bg-gray-400 group-hover:bg-gray-500 rounded-r-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        {/* Collapse/Expand Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white border border-gray-300 rounded-r-md shadow-sm hover:bg-gray-50 transition-all duration-200"
          style={{
            left: isSidebarCollapsed ? "0" : `${sidebarWidth - 1}px`,
          }}
          title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          )}
        </button>

        <div className="flex-1 flex flex-col overflow-hidden">
          {currentNode && (
            <div className="shrink-0 bg-white border-b px-8 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-full">
                      Topic {currentNode.data.order}
                    </span>
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full capitalize">
                      {currentNode.data.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    {currentNode.data.label}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {currentNode.data.description}
                  </p>
                </div>
                <Button
                  onClick={handleMarkComplete}
                  variant={
                    selectedResource &&
                    currentNodeId &&
                    completedResources[currentNodeId]?.has(selectedResource.id)
                      ? "default"
                      : "outline"
                  }
                  disabled={!selectedResource}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {selectedResource &&
                  currentNodeId &&
                  completedResources[currentNodeId]?.has(selectedResource.id)
                    ? "Completed"
                    : "Mark complete"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            {showTreeView ? (
              <div className="h-full">
                <RoadmapCanvas
                  nodes={roadmap.nodes}
                  edges={roadmap.edges}
                  onNodeClick={(node) => handleNodeSelect(node.id)}
                />
              </div>
            ) : (
              <div className="h-full">
                {isLoadingResources ? (
                  <div className="h-full flex items-center justify-center">
                    <LoadingOverlay message="Loading resources..." />
                  </div>
                ) : selectedResource ? (
                  <EmbeddedResourceViewer
                    resource={selectedResource}
                    onClose={() => setSelectedResource(null)}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm font-medium mb-1">
                        No resources available
                      </p>
                      <p className="text-xs">
                        Resources will appear here once loaded
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {currentNode &&
            currentNode.data.resources &&
            currentNode.data.resources.length > 1 &&
            !showTreeView && (
              <div className="shrink-0 bg-white border-t px-8 py-4">
                <p className="text-xs font-medium text-foreground mb-2">
                  Available resources
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentNode.data.resources.map((resource, index) => {
                    const isCompleted = currentNodeId
                      ? completedResources[currentNodeId]?.has(resource.id) ||
                        false
                      : false;
                    return (
                      <button
                        key={resource.id}
                        onClick={() => {
                          setSelectedResource(resource);
                          setCurrentResourceIndex(index);

                          // Save position when resource is clicked
                          if (roadmap && currentNodeId) {
                            const updatedRoadmap = {
                              ...roadmap,
                              lastPosition: {
                                nodeId: currentNodeId,
                                resourceIndex: index,
                              },
                              updatedAt: new Date().toISOString(),
                            };
                            updateRoadmap(roadmap.id, updatedRoadmap);
                          }
                        }}
                        className={`
                        shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border flex items-center gap-1.5
                        ${
                          index === currentResourceIndex
                            ? "bg-gray-900 text-white border-gray-900"
                            : isCompleted
                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                            : "bg-white text-gray-700 hover:bg-gray-50"
                        }
                      `}
                      >
                        {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        <span className="capitalize">{resource.type}</span>
                        {resource.type === "youtube" &&
                          resource.metadata &&
                          "duration" in resource.metadata &&
                          resource.metadata.duration && (
                            <span className="ml-1 opacity-70">
                              • {resource.metadata.duration}
                            </span>
                          )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          <div className="shrink-0 bg-white border-t px-8 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousTopic}
              disabled={!canGoPrevious}
            >
              Previous{" "}
              {currentNode && currentResourceIndex > 0 ? "Resource" : "Topic"}
            </Button>
            <div className="text-xs text-muted-foreground">
              {currentNode &&
              currentNode.data.resources &&
              currentNode.data.resources.length > 0
                ? `Resource ${currentResourceIndex + 1} / ${
                    currentNode.data.resources.length
                  }`
                : ""}
              {currentIndex >= 0 && (
                <span className="ml-2">
                  Topic {currentIndex + 1} / {dfsNodes.length}
                </span>
              )}
            </div>
            <Button onClick={handleNextTopic} disabled={!canGoNext}>
              Next{" "}
              {currentNode &&
              currentNode.data.resources &&
              currentResourceIndex < currentNode.data.resources.length - 1
                ? "Resource"
                : "Topic"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getSortedNodes(
  nodes: Node<RoadmapNodeData>[]
): Node<RoadmapNodeData>[] {
  return [...nodes].sort((a, b) => {
    if (a.data.level !== b.data.level) {
      return a.data.level - b.data.level;
    }
    return a.data.order - b.data.order;
  });
}
