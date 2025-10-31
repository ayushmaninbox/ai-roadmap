'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Brain, Bookmark, Network, TrendingUp, Zap, Target } from 'lucide-react';
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
  'Mobile Development',
];

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
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
    if (e.key === 'Enter') {
      handleGenerateRoadmap();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.05),transparent_50%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
              <div className="relative bg-white p-3 rounded-2xl shadow-lg">
                <Network className="w-10 h-10 text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text" strokeWidth={2.5} />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              StudyPath
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">
            AI-powered learning paths that adapt to you. Learn smarter, not harder.
          </p>
        </div>

        <div className="max-w-3xl mx-auto mb-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-20" />
            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 p-8 sm:p-10">
              <label
                htmlFor="topic-input"
                className="block text-xl font-bold text-gray-900 mb-4"
              >
                What do you want to master?
              </label>
              <div className="relative">
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
                  className="text-lg h-14 pl-5 pr-5 bg-white border-2 border-gray-200 focus:border-blue-400 rounded-xl shadow-sm"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-3 font-medium">{error}</p>
              )}
              <Button
                onClick={handleGenerateRoadmap}
                className="w-full h-14 text-lg font-bold mt-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                size="lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Learning Path
              </Button>

              <div className="mt-6">
                <p className="text-sm text-gray-500 mb-3 font-medium">Popular topics:</p>
                <div className="flex flex-wrap gap-2">
                  {exampleTopics.map((example) => (
                    <button
                      key={example}
                      onClick={() => handleExampleClick(example)}
                      className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-full hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 border border-blue-200/50"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-4 shadow-lg">
                <Brain className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">AI-Powered</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Custom roadmaps generated by advanced AI that understands your learning goals
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl mb-4 shadow-lg">
                <Bookmark className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Rich Resources</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Curated videos, docs, and tutorials embedded right in your learning flow
              </p>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <div className="relative bg-white/60 backdrop-blur-lg rounded-2xl p-8 border border-white/50 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl mb-4 shadow-lg">
                <TrendingUp className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Track Progress</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Mark topics complete and visualize your journey to mastery
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Your Learning Paths
            </h2>
            {roadmaps.length > 0 && (
              <div className="text-sm text-gray-500 font-medium">
                {roadmaps.length} {roadmaps.length === 1 ? 'roadmap' : 'roadmaps'}
              </div>
            )}
          </div>
          {roadmaps.length === 0 ? (
            <div className="text-center py-20 bg-white/40 backdrop-blur-lg rounded-2xl border-2 border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl mb-4">
                <Network className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium text-lg mb-2">
                No roadmaps yet
              </p>
              <p className="text-gray-500 text-sm">
                Create your first learning path above and start your journey
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
