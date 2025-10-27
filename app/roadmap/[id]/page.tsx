'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Download } from 'lucide-react';
import Link from 'next/link';
import { Node } from 'reactflow';
import RoadmapCanvas from '@/components/RoadmapCanvas';
import ResourceSidebar from '@/components/ResourceSidebar';
import LoadingOverlay from '@/components/LoadingOverlay';
import ErrorMessage from '@/components/ErrorMessage';
import { Button } from '@/components/ui/button';
import { getRoadmap, saveRoadmap, updateRoadmap } from '@/lib/storage';
import { Roadmap, RoadmapNodeData } from '@/lib/types';

export default function RoadmapPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const topic = searchParams.get('topic');

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node<RoadmapNodeData> | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);

  // Load or generate roadmap on mount
  useEffect(() => {
    const loadRoadmap = async () => {
      if (id === 'new' && topic) {
        // Generate new roadmap
        await generateRoadmap(topic);
      } else {
        // Load existing roadmap
        const existingRoadmap = getRoadmap(id);
        if (existingRoadmap) {
          setRoadmap(existingRoadmap);
          setIsLoading(false);
        } else {
          setError('Roadmap not found');
          setIsLoading(false);
          // Redirect to home after 2 seconds
          setTimeout(() => {
            router.push('/');
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
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic: topicToGenerate }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate roadmap');
      }

      const newRoadmap = data.roadmap;

      // Save to localStorage
      saveRoadmap(newRoadmap);

      // Update state and URL
      setRoadmap(newRoadmap);
      router.replace(`/roadmap/${newRoadmap.id}`);
      setIsLoading(false);
    } catch (err) {
      console.error('Error generating roadmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate roadmap');
      setIsLoading(false);
    }
  };

  const handleNodeClick = useCallback(
    async (node: Node<RoadmapNodeData>) => {
      setSelectedNode(node);
      setIsSidebarOpen(true);

      // Fetch resources if not already fetched
      if (!node.data.resourcesFetched && roadmap) {
        setIsLoadingResources(true);

        try {
          const response = await fetch('/api/fetch-resources', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              nodeTitle: node.data.label,
              nodeTopic: roadmap.topic,
              nodeDescription: node.data.description,
            }),
          });

          const data = await response.json();

          if (data.success && data.resources) {
            // Update node data with fetched resources
            const updatedNodes = roadmap.nodes.map((n) =>
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
              ...roadmap,
              nodes: updatedNodes,
            };

            // Update state
            setRoadmap(updatedRoadmap);

            // Update selected node
            const updatedNode = updatedNodes.find((n) => n.id === node.id);
            if (updatedNode) {
              setSelectedNode(updatedNode);
            }

            // Save to localStorage
            updateRoadmap(roadmap.id, { nodes: updatedNodes });
          }
        } catch (err) {
          console.error('Error fetching resources:', err);
        } finally {
          setIsLoadingResources(false);
        }
      }
    },
    [roadmap]
  );

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleSave = () => {
    if (roadmap) {
      saveRoadmap(roadmap);
      alert('Roadmap saved!');
    }
  };

  const handleExport = () => {
    if (roadmap) {
      const dataStr = JSON.stringify(roadmap, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${roadmap.topic.replace(/\s+/g, '-')}-roadmap.json`;
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
    return <ErrorMessage message={error} onRetry={() => router.push('/')} />;
  }

  if (!roadmap) {
    return <ErrorMessage message="Roadmap not found" />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {roadmap.title}
            </h1>
            <p className="text-xs text-gray-500">{roadmap.nodeCount} topics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Main content area */}
      <div className="flex-1 relative">
        <RoadmapCanvas
          nodes={roadmap.nodes}
          edges={roadmap.edges}
          onNodeClick={handleNodeClick}
        />

        {/* Resource sidebar */}
        <ResourceSidebar
          nodeData={selectedNode?.data || null}
          isOpen={isSidebarOpen}
          isLoading={isLoadingResources}
          onClose={handleCloseSidebar}
        />
      </div>
    </div>
  );
}
