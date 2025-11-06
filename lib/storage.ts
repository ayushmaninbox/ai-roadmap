import { Roadmap, RoadmapMetadata } from "./types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_PREFIX = "studypath";
const ROADMAPS_LIST_KEY = `${STORAGE_PREFIX}_roadmaps`;
const MAX_ROADMAPS = 10;

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves a roadmap to localStorage
 * Updates the roadmaps list and stores the full roadmap
 */
export function saveRoadmap(roadmap: Roadmap): void {
  if (!isStorageAvailable()) {
    throw new Error("localStorage is not available");
  }

  try {
    // Update roadmaps list
    const roadmaps = getAllRoadmapsMetadata();

    // Check if roadmap already exists
    const existingIndex = roadmaps.findIndex((r) => r.id === roadmap.id);

    // Calculate completed resources count
    // Use same logic as sidebar: estimate 5 resources per node if not fetched
    let completedCount = 0;
    let totalResources = 0;
    const ESTIMATED_RESOURCES_PER_NODE = 5;

    if (roadmap.completedResources) {
      Object.values(roadmap.completedResources).forEach((resourceIds) => {
        completedCount += resourceIds.length;
      });
    }

    roadmap.nodes.forEach((node) => {
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
    });

    const metadata: RoadmapMetadata = {
      id: roadmap.id,
      title: roadmap.title,
      topic: roadmap.topic,
      createdAt: roadmap.createdAt,
      nodeCount: roadmap.nodeCount,
      completedCount: completedCount,
      totalResources: totalResources,
    };

    if (existingIndex >= 0) {
      // Update existing
      roadmaps[existingIndex] = metadata;
    } else {
      // Add new at the beginning
      roadmaps.unshift(metadata);

      // Limit to MAX_ROADMAPS
      if (roadmaps.length > MAX_ROADMAPS) {
        // Remove oldest roadmap
        const removed = roadmaps.pop();
        if (removed) {
          deleteRoadmap(removed.id);
        }
      }
    }

    // Save updated list
    localStorage.setItem(ROADMAPS_LIST_KEY, JSON.stringify(roadmaps));

    // Save full roadmap
    const roadmapKey = `${STORAGE_PREFIX}_roadmap_${roadmap.id}`;
    localStorage.setItem(roadmapKey, JSON.stringify(roadmap));
  } catch (error) {
    if (error instanceof Error && error.name === "QuotaExceededError") {
      throw new Error("Storage quota exceeded. Please delete old roadmaps.");
    }
    throw new Error("Failed to save roadmap");
  }
}

/**
 * Retrieves a roadmap from localStorage by ID
 */
export function getRoadmap(id: string): Roadmap | null {
  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const roadmapKey = `${STORAGE_PREFIX}_roadmap_${id}`;
    const data = localStorage.getItem(roadmapKey);

    if (!data) {
      return null;
    }

    const roadmap = JSON.parse(data) as Roadmap;

    // Validate structure
    if (!roadmap.id || !roadmap.nodes || !roadmap.edges) {
      throw new Error("Invalid roadmap structure");
    }

    // Backward compatibility: migrate completedNodes to completedResources
    if (
      (roadmap as any).completedNodes &&
      Array.isArray((roadmap as any).completedNodes)
    ) {
      // Old format: completedNodes was an array of node IDs
      // We can't migrate this perfectly since we don't know which resources were completed
      // So we'll just initialize completedResources as empty
      roadmap.completedResources = {};
      delete (roadmap as any).completedNodes;
    }

    // Ensure completedResources exists
    if (!roadmap.completedResources) {
      roadmap.completedResources = {};
    }

    return roadmap;
  } catch (error) {
    console.error("Failed to load roadmap:", error);
    // Remove corrupted data
    deleteRoadmap(id);
    return null;
  }
}

/**
 * Gets metadata for all saved roadmaps
 */
export function getAllRoadmapsMetadata(): RoadmapMetadata[] {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    const data = localStorage.getItem(ROADMAPS_LIST_KEY);
    if (!data) {
      return [];
    }

    return JSON.parse(data) as RoadmapMetadata[];
  } catch (error) {
    console.error("Failed to load roadmaps list:", error);
    // Reset corrupted list
    localStorage.removeItem(ROADMAPS_LIST_KEY);
    return [];
  }
}

/**
 * Gets all full roadmap objects
 */
export function getAllRoadmaps(): Roadmap[] {
  const metadata = getAllRoadmapsMetadata();
  return metadata
    .map((m) => getRoadmap(m.id))
    .filter((roadmap): roadmap is Roadmap => roadmap !== null);
}

/**
 * Deletes a roadmap from localStorage
 */
export function deleteRoadmap(id: string): void {
  if (!isStorageAvailable()) {
    return;
  }

  try {
    // Remove from list
    const roadmaps = getAllRoadmapsMetadata();
    const filtered = roadmaps.filter((r) => r.id !== id);
    localStorage.setItem(ROADMAPS_LIST_KEY, JSON.stringify(filtered));

    // Remove full roadmap
    const roadmapKey = `${STORAGE_PREFIX}_roadmap_${id}`;
    localStorage.removeItem(roadmapKey);
  } catch (error) {
    console.error("Failed to delete roadmap:", error);
  }
}

/**
 * Updates a roadmap in localStorage
 * Partial update supported
 */
export function updateRoadmap(id: string, updates: Partial<Roadmap>): void {
  const roadmap = getRoadmap(id);
  if (!roadmap) {
    throw new Error("Roadmap not found");
  }

  const updated: Roadmap = {
    ...roadmap,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveRoadmap(updated);
}

/**
 * Clears all roadmaps from localStorage
 */
export function clearAllRoadmaps(): void {
  if (!isStorageAvailable()) {
    return;
  }

  const roadmaps = getAllRoadmapsMetadata();
  roadmaps.forEach((r) => deleteRoadmap(r.id));
  localStorage.removeItem(ROADMAPS_LIST_KEY);
}

/**
 * Gets storage usage information
 */
export function getStorageInfo(): {
  available: boolean;
  roadmapCount: number;
  maxRoadmaps: number;
} {
  return {
    available: isStorageAvailable(),
    roadmapCount: getAllRoadmapsMetadata().length,
    maxRoadmaps: MAX_ROADMAPS,
  };
}

/**
 * Imports a roadmap from JSON data
 * Validates the structure and saves it to localStorage
 */
export function importRoadmap(jsonData: string): {
  success: boolean;
  roadmap?: Roadmap;
  error?: string;
} {
  if (!isStorageAvailable()) {
    return {
      success: false,
      error: "localStorage is not available",
    };
  }

  try {
    const data = JSON.parse(jsonData);
    const roadmap = data as Roadmap;

    // Validate structure
    if (!roadmap.nodes || !roadmap.edges) {
      return {
        success: false,
        error:
          "Invalid roadmap structure: missing required fields (nodes, edges)",
      };
    }

    // Validate nodes structure
    if (!Array.isArray(roadmap.nodes) || roadmap.nodes.length === 0) {
      return {
        success: false,
        error: "Invalid roadmap structure: nodes must be a non-empty array",
      };
    }

    // Validate edges structure
    if (!Array.isArray(roadmap.edges)) {
      return {
        success: false,
        error: "Invalid roadmap structure: edges must be an array",
      };
    }

    // Ensure required fields exist
    if (!roadmap.topic || !roadmap.title) {
      return {
        success: false,
        error: "Invalid roadmap structure: missing topic or title",
      };
    }

    // Ensure completedResources exists
    if (!roadmap.completedResources) {
      roadmap.completedResources = {};
    }

    // Ensure lastPosition exists
    if (!roadmap.lastPosition) {
      roadmap.lastPosition = undefined;
    }

    // Update timestamps
    const now = new Date().toISOString();
    if (!roadmap.createdAt) {
      roadmap.createdAt = now;
    }
    roadmap.updatedAt = now;

    // Ensure nodeCount matches actual node count
    roadmap.nodeCount = roadmap.nodes.length;

    // Generate a new ID to avoid conflicts with existing roadmaps
    // This ensures imported roadmaps don't overwrite existing ones
    roadmap.id = uuidv4();

    // Save the roadmap
    saveRoadmap(roadmap);

    return {
      success: true,
      roadmap,
    };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: "Invalid JSON format",
      };
    }
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to import roadmap",
    };
  }
}
