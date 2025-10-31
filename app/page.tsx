"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Brain,
  Bookmark,
  Network,
  TrendingUp,
  Zap,
  Target,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RoadmapCard from "@/components/RoadmapCard";
import { getAllRoadmapsMetadata, deleteRoadmap } from "@/lib/storage";
import { validateTopic } from "@/lib/utils";
import { RoadmapMetadata } from "@/lib/types";

const exampleTopics = [
  "React Development",
  "Machine Learning",
  "Data Science",
  "Web3",
  "UI/UX Design",
  "Mobile Development",
];

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapMetadata[]>([]);

  useEffect(() => {
    const savedRoadmaps = getAllRoadmapsMetadata();
    setRoadmaps(savedRoadmaps);
  }, []);

  const handleGenerateRoadmap = () => {
    const validationError = validateTopic(topic);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const encodedTopic = encodeURIComponent(topic.trim());
    router.push(`/roadmap/new?topic=${encodedTopic}`);
  };

  const handleExampleClick = (exampleTopic: string) => {
    setTopic(exampleTopic);
    setError(null);
  };

  const handleDeleteRoadmap = (id: string) => {
    deleteRoadmap(id);
    setRoadmaps(getAllRoadmapsMetadata());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-14 space-y-3">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <Network className="w-8 h-8 text-foreground/70" strokeWidth={2} />
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-foreground">
              StudyPath
            </h1>
          </div>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            AI-powered learning paths with curated resources.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-16">
          <div className="bg-white border rounded-xl p-6">
            <label
              htmlFor="topic-input"
              className="block text-sm font-medium text-foreground mb-2"
            >
              What do you want to learn?
            </label>
            <div className="flex gap-2">
              <Input
                id="topic-input"
                type="text"
                placeholder="React, AI, Photography, anything..."
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                className="h-11"
              />
              <Button onClick={handleGenerateRoadmap} className="h-11 px-5">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive mt-2 font-medium">
                {error}
              </p>
            )}

            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Popular topics
              </p>
              <div className="flex flex-wrap gap-2">
                {exampleTopics.map((example) => (
                  <button
                    key={example}
                    onClick={() => handleExampleClick(example)}
                    className="px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground rounded-full border"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white border rounded-xl p-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 mb-3">
              <Brain className="w-5 h-5 text-foreground/70" strokeWidth={2} />
            </div>
            <h3 className="font-medium text-sm text-foreground mb-1">
              AI-powered
            </h3>
            <p className="text-sm text-muted-foreground">
              Custom roadmaps tailored to your goals.
            </p>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 mb-3">
              <Bookmark
                className="w-5 h-5 text-foreground/70"
                strokeWidth={2}
              />
            </div>
            <h3 className="font-medium text-sm text-foreground mb-1">
              Rich resources
            </h3>
            <p className="text-sm text-muted-foreground">
              Videos, docs, and tutorials in one place.
            </p>
          </div>

          <div className="bg-white border rounded-xl p-6">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-gray-100 mb-3">
              <TrendingUp
                className="w-5 h-5 text-foreground/70"
                strokeWidth={2}
              />
            </div>
            <h3 className="font-medium text-sm text-foreground mb-1">
              Track progress
            </h3>
            <p className="text-sm text-muted-foreground">
              Mark topics complete as you advance.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Your learning paths
            </h2>
            {roadmaps.length > 0 && (
              <div className="text-xs text-muted-foreground font-medium">
                {roadmaps.length}{" "}
                {roadmaps.length === 1 ? "roadmap" : "roadmaps"}
              </div>
            )}
          </div>
          {roadmaps.length === 0 ? (
            <div className="text-center py-16 bg-white border rounded-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-md mb-3">
                <Network className="w-6 h-6 text-foreground/50" />
              </div>
              <p className="text-foreground text-sm font-medium mb-1">
                No roadmaps yet
              </p>
              <p className="text-xs text-muted-foreground">
                Create your first learning path above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roadmaps.map((roadmap) => (
                <RoadmapCard
                  key={roadmap.id}
                  roadmap={roadmap}
                  onDelete={handleDeleteRoadmap}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
