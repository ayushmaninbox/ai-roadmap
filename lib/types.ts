import { Node, Edge } from 'reactflow';

// Resource types
export type ResourceType = 'youtube' | 'documentation' | 'article' | 'tutorial' | 'course';

// Resource metadata interfaces
export interface YouTubeMetadata {
  duration?: string;
  thumbnail?: string;
  views?: string;
  channel?: string;
}

export interface ArticleMetadata {
  author?: string;
  readTime?: string;
  publishedDate?: string;
}

export interface DocumentationMetadata {
  version?: string;
}

export type ResourceMetadata = YouTubeMetadata | ArticleMetadata | DocumentationMetadata | Record<string, never>;

// Resource interface
export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  url: string;
  description: string;
  source: string;
  metadata: ResourceMetadata;
}

// Node data interface (extends React Flow's node data)
export interface RoadmapNodeData {
  label: string;
  description: string;
  level: number;
  order: number;
  category: string;
  resources: Resource[] | null;
  resourcesFetched: boolean;
}

// Roadmap node type (React Flow compatible)
export type RoadmapNode = Node<RoadmapNodeData>;

// Roadmap edge type (React Flow compatible)
export type RoadmapEdge = Edge;

// Complete roadmap interface
export interface Roadmap {
  id: string;
  topic: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
}

// API request/response types

// Generate Roadmap API
export interface GenerateRoadmapRequest {
  topic: string;
}

export interface GenerateRoadmapResponse {
  success: boolean;
  roadmap?: Roadmap;
  error?: string;
}

// Fetch Resources API
export interface FetchResourcesRequest {
  nodeTitle: string;
  nodeTopic?: string;
  nodeDescription?: string;
}

export interface FetchResourcesResponse {
  success: boolean;
  resources?: Resource[];
  error?: string;
  partialResources?: Resource[];
}

// localStorage types
export interface RoadmapMetadata {
  id: string;
  title: string;
  topic: string;
  createdAt: string;
  nodeCount: number;
}

// Error types
export class RoadmapError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'RoadmapError';
    this.statusCode = statusCode;
  }
}

export class OAuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'OAuthError';
    this.statusCode = statusCode;
  }
}
