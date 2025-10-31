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
} from "lucide-react";
import Link from "next/link";
import { Node } from "reactflow";
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
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [completedNodes, setCompletedNodes] = useState<Set<string>>(new Set());
  const [showTreeView, setShowTreeView] = useState(false);

  useEffect(() => {
    const loadRoadmap = async () => {
      if (id === "new" && topic) {
        await generateRoadmap(topic);
      } else {
        const existingRoadmap = getRoadmap(id);
        if (existingRoadmap) {
          setRoadmap(existingRoadmap);
          const firstNode = getSortedNodes(existingRoadmap.nodes)[0];
          if (firstNode) {
            setCurrentNodeId(firstNode.id);
            await fetchResourcesForNode(firstNode, existingRoadmap);
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
      saveRoadmap(newRoadmap);
      setRoadmap(newRoadmap);

      const firstNode = getSortedNodes(newRoadmap.nodes)[0];
      if (firstNode) {
        setCurrentNodeId(firstNode.id);
        await fetchResourcesForNode(firstNode, newRoadmap);
      }

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

      if (roadmap) {
        const node = roadmap.nodes.find((n) => n.id === nodeId);
        if (node) {
          await fetchResourcesForNode(node, roadmap);
        }
      }
    },
    [roadmap]
  );

  const handleMarkComplete = () => {
    if (currentNodeId) {
      const newCompleted = new Set(completedNodes);
      if (newCompleted.has(currentNodeId)) {
        newCompleted.delete(currentNodeId);
      } else {
        newCompleted.add(currentNodeId);
      }
      setCompletedNodes(newCompleted);
    }
  };

  const handleNextTopic = () => {
    if (!roadmap || !currentNodeId) return;

    const sortedNodes = getSortedNodes(roadmap.nodes);
    const currentIndex = sortedNodes.findIndex((n) => n.id === currentNodeId);

    if (currentIndex < sortedNodes.length - 1) {
      const nextNode = sortedNodes[currentIndex + 1];
      handleNodeSelect(nextNode.id);
    }
  };

  const handlePreviousTopic = () => {
    if (!roadmap || !currentNodeId) return;

    const sortedNodes = getSortedNodes(roadmap.nodes);
    const currentIndex = sortedNodes.findIndex((n) => n.id === currentNodeId);

    if (currentIndex > 0) {
      const prevNode = sortedNodes[currentIndex - 1];
      handleNodeSelect(prevNode.id);
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
  const sortedNodes = getSortedNodes(roadmap.nodes);
  const currentIndex = sortedNodes.findIndex((n) => n.id === currentNodeId);
  const isFirstTopic = currentIndex === 0;
  const isLastTopic = currentIndex === sortedNodes.length - 1;

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

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 shrink-0">
          <TopicNavigationSidebar
            nodes={roadmap.nodes}
            currentNodeId={currentNodeId}
            completedNodes={completedNodes}
            onNodeSelect={handleNodeSelect}
            edges={roadmap.edges}
          />
        </div>

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
                    completedNodes.has(currentNodeId!) ? "default" : "outline"
                  }
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {completedNodes.has(currentNodeId!)
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
                  {currentNode.data.resources.map((resource) => (
                    <button
                      key={resource.id}
                      onClick={() => setSelectedResource(resource)}
                      className={`
                      shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border
                      ${
                        selectedResource?.id === resource.id
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 hover:bg-gray-50"
                      }
                    `}
                    >
                      <span className="capitalize">{resource.type}</span>
                      {resource.type === "youtube" &&
                        resource.metadata &&
                        "duration" in resource.metadata &&
                        resource.metadata.duration && (
                          <span className="ml-2 opacity-70">
                            • {resource.metadata.duration}
                          </span>
                        )}
                    </button>
                  ))}
                </div>
              </div>
            )}

          <div className="shrink-0 bg-white border-t px-8 py-4 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePreviousTopic}
              disabled={isFirstTopic}
            >
              Previous Topic
            </Button>
            <div className="text-xs text-muted-foreground">
              {currentIndex + 1} / {sortedNodes.length}
            </div>
            <Button onClick={handleNextTopic} disabled={isLastTopic}>
              Next Topic
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
