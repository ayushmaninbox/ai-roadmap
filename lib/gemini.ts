import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoadmapNode, RoadmapEdge } from './types';

const apiKey = process.env.GOOGLE_AI_API_KEY;

if (!apiKey) {
  throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generates a structured roadmap using Gemini AI
 * Returns nodes and edges for React Flow
 */
export async function generateRoadmapStructure(topic: string): Promise<{
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert learning path designer. Create a comprehensive, structured learning roadmap for the topic: "${topic}".

Requirements:
1. Return ONLY valid JSON, no markdown formatting, no code blocks
2. Create 15-25 nodes (topics and subtopics) with clear hierarchy
3. Structure should be a directed acyclic graph (DAG) - no cycles
4. Each node needs: unique id, title, description (2-4 sentences), level (1-5), category
5. Include edges showing prerequisite relationships
6. Calculate x,y positions for hierarchical tree layout (left-to-right flow)

JSON structure:
{
  "nodes": [
    {
      "id": "node_1",
      "type": "custom",
      "position": {"x": 100, "y": 200},
      "data": {
        "label": "Topic Title",
        "description": "Detailed explanation of this topic",
        "level": 1,
        "category": "fundamentals",
        "resources": null,
        "resourcesFetched": false
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1_2",
      "source": "node_1",
      "target": "node_2",
      "type": "smoothstep",
      "animated": false
    }
  ]
}

Layout rules:
- Level 1 (fundamentals): x=100, y values spaced 150px apart
- Level 2: x=400
- Level 3: x=700
- Level 4+: x=1000
- Space nodes vertically by 150-200px to avoid overlap
- Ensure parent nodes connect to child nodes via edges

Categories to use: fundamentals, advanced, tools, practice, projects, theory

Generate the roadmap now. Return ONLY the JSON object, nothing else.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Remove markdown code blocks if present
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    // Parse JSON response
    const parsed = JSON.parse(jsonText);

    // Validate structure
    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Invalid response: missing nodes array');
    }
    if (!parsed.edges || !Array.isArray(parsed.edges)) {
      throw new Error('Invalid response: missing edges array');
    }

    // Validate each node has required fields
    for (const node of parsed.nodes) {
      if (!node.id || !node.type || !node.position || !node.data) {
        throw new Error('Invalid node structure');
      }
      if (!node.data.label || !node.data.description || !node.data.level || !node.data.category) {
        throw new Error('Invalid node data structure');
      }
      // Ensure resources fields are present
      if (node.data.resources === undefined) {
        node.data.resources = null;
      }
      if (node.data.resourcesFetched === undefined) {
        node.data.resourcesFetched = false;
      }
    }

    return {
      nodes: parsed.nodes as RoadmapNode[],
      edges: parsed.edges as RoadmapEdge[],
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error('Failed to generate roadmap structure');
  }
}

/**
 * Retry wrapper for API calls with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
