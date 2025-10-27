import { NextRequest, NextResponse } from 'next/server';
import { fetchYouTubeVideos } from '@/lib/youtube';
import { fetchWebResources } from '@/lib/serper';
import { FetchResourcesRequest, FetchResourcesResponse, Resource } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: FetchResourcesRequest = await request.json();
    const { nodeTitle, nodeTopic, nodeDescription } = body;

    // Validate input
    if (!nodeTitle) {
      return NextResponse.json(
        {
          success: false,
          error: 'nodeTitle is required',
        } as FetchResourcesResponse,
        { status: 400 }
      );
    }

    // Construct search query
    const query = nodeTopic ? `${nodeTitle} ${nodeTopic}` : nodeTitle;

    // Fetch resources from both APIs in parallel
    const results = await Promise.allSettled([
      fetchYouTubeVideos(query),
      fetchWebResources(query),
    ]);

    // Extract results
    const youtubeResult = results[0];
    const serperResult = results[1];

    let youtubeVideos: Resource[] = [];
    let webResources: Resource[] = [];

    // Handle YouTube results
    if (youtubeResult.status === 'fulfilled') {
      youtubeVideos = youtubeResult.value;
    } else {
      console.error('YouTube API failed:', youtubeResult.reason);
    }

    // Handle Serper results
    if (serperResult.status === 'fulfilled') {
      webResources = serperResult.value;
    } else {
      console.error('Serper API failed:', serperResult.reason);
    }

    // Combine resources
    const allResources: Resource[] = [];

    // Strategy: Mix of videos and web resources
    // 1. Add official documentation first (if exists)
    const officialDoc = webResources.find(r => r.type === 'documentation');
    if (officialDoc) {
      allResources.push(officialDoc);
      webResources = webResources.filter(r => r.id !== officialDoc.id);
    }

    // 2. Add top 2 YouTube videos
    allResources.push(...youtubeVideos.slice(0, 2));

    // 3. Add remaining web resources to reach 5 total
    const remaining = 5 - allResources.length;
    allResources.push(...webResources.slice(0, remaining));

    // Re-assign IDs sequentially
    allResources.forEach((resource, index) => {
      resource.id = `resource_${index + 1}`;
    });

    // Check if we have any resources
    if (allResources.length === 0) {
      // Both APIs failed or returned no results
      if (youtubeResult.status === 'rejected' && serperResult.status === 'rejected') {
        return NextResponse.json(
          {
            success: false,
            error: 'Unable to fetch resources. Please try again later.',
            partialResources: [],
          } as FetchResourcesResponse,
          { status: 500 }
        );
      }

      // No results found but APIs worked
      return NextResponse.json(
        {
          success: true,
          resources: [],
        } as FetchResourcesResponse,
        { status: 200 }
      );
    }

    // Return success with resources
    return NextResponse.json(
      {
        success: true,
        resources: allResources,
      } as FetchResourcesResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        partialResources: [],
      } as FetchResourcesResponse,
      { status: 500 }
    );
  }
}
