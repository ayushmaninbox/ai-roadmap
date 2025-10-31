import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoadmapNode, RoadmapEdge } from './types';

const apiKey = process.env.GOOGLE_AI_API_KEY || '';

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Generates a structured roadmap using Gemini AI
 * Returns nodes and edges for React Flow
 */
export async function generateRoadmapStructure(topic: string): Promise<{
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}> {
  if (!genAI) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  const prompt = `You are an expert learning path designer. Create a comprehensive, structured learning roadmap for the topic: "${topic}".

Requirements:
1. Return ONLY valid JSON, no markdown formatting, no code blocks
2. Create 15-25 nodes (topics and subtopics) with STRICT hierarchical structure
3. Structure should be a tree (each node has exactly ONE parent, except root)
4. Each node needs: unique id, title, description (2-4 sentences), level (1-5), category, order (sequential number within same level)
5. Include edges showing parent-child relationships ONLY
6. Calculate x,y positions for clean vertical tree layout (top-to-bottom flow)

JSON structure:
{
  "nodes": [
    {
      "id": "node_1",
      "type": "custom",
      "position": {"x": 500, "y": 0},
      "data": {
        "label": "Topic Title",
        "description": "Detailed explanation of this topic",
        "level": 1,
        "order": 1,
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

CRITICAL Layout rules for clean tree structure:
- Start with 1 root node at level 1 (x=500, y=0)
- Level 1 nodes: y=0
- Level 2 nodes: y=200
- Level 3 nodes: y=400
- Level 4 nodes: y=600
- Level 5 nodes: y=800
- Distribute nodes horizontally within each level evenly (x spacing: 250-350px)
- Each node should have EXACTLY ONE incoming edge (except root)
- Children of same parent should be grouped horizontally
- Add "order" field (1, 2, 3...) to maintain learning sequence

Categories to use: fundamentals, intermediate, advanced, tools, practice, projects

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
      // Ensure order field is present
      if (node.data.order === undefined) {
        node.data.order = 1;
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
