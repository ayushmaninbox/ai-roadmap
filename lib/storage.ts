import { Roadmap, RoadmapMetadata } from './types';

const STORAGE_PREFIX = 'studypath';
const ROADMAPS_LIST_KEY = `${STORAGE_PREFIX}_roadmaps`;
const MAX_ROADMAPS = 10;

/**
 * Checks if localStorage is available
 */
export function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
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
    throw new Error('localStorage is not available');
  }

  try {
    // Update roadmaps list
    const roadmaps = getAllRoadmapsMetadata();

    // Check if roadmap already exists
    const existingIndex = roadmaps.findIndex(r => r.id === roadmap.id);
    const metadata: RoadmapMetadata = {
      id: roadmap.id,
      title: roadmap.title,
      topic: roadmap.topic,
      createdAt: roadmap.createdAt,
      nodeCount: roadmap.nodeCount,
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
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please delete old roadmaps.');
    }
    throw new Error('Failed to save roadmap');
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
      throw new Error('Invalid roadmap structure');
    }

    return roadmap;
  } catch (error) {
    console.error('Failed to load roadmap:', error);
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
    console.error('Failed to load roadmaps list:', error);
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
    .map(m => getRoadmap(m.id))
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
    const filtered = roadmaps.filter(r => r.id !== id);
    localStorage.setItem(ROADMAPS_LIST_KEY, JSON.stringify(filtered));

    // Remove full roadmap
    const roadmapKey = `${STORAGE_PREFIX}_roadmap_${id}`;
    localStorage.removeItem(roadmapKey);
  } catch (error) {
    console.error('Failed to delete roadmap:', error);
  }
}

/**
 * Updates a roadmap in localStorage
 * Partial update supported
 */
export function updateRoadmap(id: string, updates: Partial<Roadmap>): void {
  const roadmap = getRoadmap(id);
  if (!roadmap) {
    throw new Error('Roadmap not found');
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
  roadmaps.forEach(r => deleteRoadmap(r.id));
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
