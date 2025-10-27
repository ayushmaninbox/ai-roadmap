'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Bookmark, Network } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import RoadmapCard from '@/components/RoadmapCard';
import { getAllRoadmapsMetadata, deleteRoadmap } from '@/lib/storage';
import { validateTopic } from '@/lib/utils';
import { RoadmapMetadata } from '@/lib/types';

const exampleTopics = [
  'React Development',
  'Machine Learning',
  'Data Science',
  'Web3',
  'UI/UX Design',
];

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapMetadata[]>([]);

  // Load saved roadmaps on mount
  useEffect(() => {
    const savedRoadmaps = getAllRoadmapsMetadata();
    setRoadmaps(savedRoadmaps);
  }, []);

  const handleGenerateRoadmap = () => {
    // Validate input
    const validationError = validateTopic(topic);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Clear error and navigate
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
    if (e.key === 'Enter') {
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Network className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">StudyPath AI</h1>
          </div>
          <p className="text-lg text-gray-600">
            AI-powered learning roadmaps with curated resources
          </p>
        </div>

        {/* Main input section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <label
              htmlFor="topic-input"
              className="block text-lg font-semibold text-gray-900 mb-3"
            >
              What do you want to learn?
            </label>
            <Input
              id="topic-input"
              type="text"
              placeholder="e.g., React, Machine Learning, Python, Photography..."
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setError(null);
              }}
              onKeyPress={handleKeyPress}
              className="text-lg h-12 mb-3"
            />
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <Button
              onClick={handleGenerateRoadmap}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate Roadmap
            </Button>

            {/* Example topics */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-3">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                {exampleTopics.map((example) => (
                  <button
                    key={example}
                    onClick={() => handleExampleClick(example)}
                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
              <Brain className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">AI-Generated</h3>
            <p className="text-sm text-gray-600">
              Smart roadmaps tailored to your topic
            </p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
              <Bookmark className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Curated Resources</h3>
            <p className="text-sm text-gray-600">
              Videos, docs, tutorials for each step
            </p>
          </div>
          <div className="text-center p-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-3">
              <Network className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Interactive</h3>
            <p className="text-sm text-gray-600">
              Click nodes to explore and learn
            </p>
          </div>
        </div>

        {/* Saved roadmaps section */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Your Roadmaps
          </h2>
          {roadmaps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Network className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">
                No saved roadmaps yet. Generate your first one above!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
