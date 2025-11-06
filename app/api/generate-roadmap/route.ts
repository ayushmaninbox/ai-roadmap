import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { generateRoadmapStructure, retryWithBackoff } from "@/lib/gemini";
import { sanitizeInput, validateTopic, delay } from "@/lib/utils";
import {
  Roadmap,
  GenerateRoadmapRequest,
  GenerateRoadmapResponse,
} from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateRoadmapRequest = await request.json();
    const { topic } = body;

    // Validate input
    if (!topic) {
      return NextResponse.json(
        {
          success: false,
          error: "Topic is required",
        } as GenerateRoadmapResponse,
        { status: 400 }
      );
    }

    // Validate topic
    const validationError = validateTopic(topic);
    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: validationError,
        } as GenerateRoadmapResponse,
        { status: 400 }
      );
    }

    // Sanitize topic
    const sanitizedTopic = sanitizeInput(topic);

    if (!sanitizedTopic) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid topic after sanitization",
        } as GenerateRoadmapResponse,
        { status: 400 }
      );
    }

    // Generate roadmap structure with retry logic
    let structure;
    try {
      structure = await retryWithBackoff(
        () => generateRoadmapStructure(sanitizedTopic),
        2, // max 2 retries
        1000 // 1 second base delay
      );
    } catch (error) {
      console.error("Failed to generate roadmap after retries:", error);

      // Check if it's a rate limit error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      if (errorMessage.includes("rate limit") || errorMessage.includes("429")) {
        return NextResponse.json(
          {
            success: false,
            error: "Service temporarily busy. Please try again in a moment.",
          } as GenerateRoadmapResponse,
          { status: 429 }
        );
      }

      // Check if it's a timeout
      if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("ETIMEDOUT")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Request timed out. Please try again.",
          } as GenerateRoadmapResponse,
          { status: 408 }
        );
      }

      // Check if content policy violation
      if (
        errorMessage.includes("policy") ||
        errorMessage.includes("inappropriate")
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Unable to generate roadmap for this topic. Please try a different topic.",
          } as GenerateRoadmapResponse,
          { status: 400 }
        );
      }

      // Generic error
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate roadmap. Please try again.",
        } as GenerateRoadmapResponse,
        { status: 500 }
      );
    }

    // Create complete roadmap object
    const roadmap: Roadmap = {
      id: uuidv4(),
      topic: sanitizedTopic,
      title: `${sanitizedTopic} Roadmap`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodeCount: structure.nodes.length,
      nodes: structure.nodes,
      edges: structure.edges,
      completedResources: {}, // Initialize empty completed resources
    };

    // Return success response
    return NextResponse.json(
      {
        success: true,
        roadmap,
      } as GenerateRoadmapResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      } as GenerateRoadmapResponse,
      { status: 500 }
    );
  }
}
