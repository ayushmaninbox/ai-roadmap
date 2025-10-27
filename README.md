# StudyPath AI

AI-powered learning roadmap generator with curated resources. Generate interactive, multi-level roadmaps for any topic you want to learn, complete with YouTube videos, documentation, tutorials, and articles.

## Features

- **AI-Generated Roadmaps**: Powered by Gemini 2.5 Flash to create structured learning paths
- **Interactive Visualization**: Built with React Flow for intuitive roadmap exploration
- **Curated Resources**: Automatically fetches relevant YouTube videos, documentation, and articles for each topic
- **Local Storage**: Save and manage your roadmaps locally in your browser
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Export Functionality**: Download your roadmaps as JSON files

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Beautiful UI components
- **React Flow**: Interactive node-based diagrams
- **Lucide React**: Icon library

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Google Generative AI SDK**: Gemini 2.5 Flash integration
- **YouTube Data API v3**: Educational video curation
- **Serper.dev API**: Web resource discovery

### Storage
- **localStorage**: Client-side roadmap persistence (no database required)

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn package manager
- API keys for:
  - Google AI (Gemini)
  - YouTube Data API
  - Serper.dev

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd ai-roadmap
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root directory:
   ```env
   # Google AI (Gemini)
   GOOGLE_AI_API_KEY=your_google_ai_api_key_here

   # YouTube Data API
   YOUTUBE_API_KEY=your_youtube_api_key_here

   # Serper.dev API
   SERPER_API_KEY=your_serper_api_key_here

   # Next.js Configuration
   NEXT_PUBLIC_APP_NAME=StudyPath AI
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Obtaining API Keys

#### Google AI API (Gemini)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and paste it into `.env.local` as `GOOGLE_AI_API_KEY`

#### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the "YouTube Data API v3"
4. Go to "Credentials" and create an API key
5. Copy the API key and paste it into `.env.local` as `YOUTUBE_API_KEY`

#### Serper.dev API

1. Go to [Serper.dev](https://serper.dev)
2. Sign up for a free account (2,500 searches/month free tier)
3. Copy your API key from the dashboard
4. Paste it into `.env.local` as `SERPER_API_KEY`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Creating a Roadmap

1. **Enter a topic** in the text input on the home page
2. Click **"Generate Roadmap"**
3. Wait 3-5 seconds while AI generates your learning path
4. **Explore the roadmap** by panning and zooming the canvas

### Exploring Resources

1. **Click any node** in the roadmap
2. A sidebar will appear with:
   - Node description
   - Curated resources (videos, docs, articles)
3. Click any resource to open it in a new tab

### Managing Roadmaps

- **Save**: Roadmaps are automatically saved to localStorage
- **Export**: Click the "Export" button to download as JSON
- **Delete**: Click the trash icon on a roadmap card to remove it

## Project Structure

```
ai-roadmap/
├── app/
│   ├── page.tsx                   # Landing page
│   ├── layout.tsx                 # Root layout
│   ├── globals.css                # Global styles
│   ├── roadmap/[id]/
│   │   └── page.tsx               # Roadmap view page
│   └── api/
│       ├── generate-roadmap/
│       │   └── route.ts           # Roadmap generation endpoint
│       └── fetch-resources/
│           └── route.ts           # Resource fetching endpoint
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── CustomNode.tsx             # React Flow custom node
│   ├── RoadmapCanvas.tsx          # React Flow wrapper
│   ├── ResourceSidebar.tsx        # Node details sidebar
│   ├── RoadmapCard.tsx            # Saved roadmap card
│   ├── LoadingOverlay.tsx         # Loading state
│   └── ErrorMessage.tsx           # Error display
├── lib/
│   ├── types.ts                   # TypeScript types
│   ├── utils.ts                   # Utility functions
│   ├── gemini.ts                  # Gemini AI client
│   ├── youtube.ts                 # YouTube API client
│   ├── serper.ts                  # Serper API client
│   └── storage.ts                 # localStorage helpers
├── .env.local                     # Environment variables (gitignored)
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind configuration
└── package.json                   # Dependencies
```

## API Endpoints

### POST /api/generate-roadmap

Generates a structured roadmap using Gemini AI.

**Request:**
```json
{
  "topic": "React Development"
}
```

**Response:**
```json
{
  "success": true,
  "roadmap": {
    "id": "uuid",
    "topic": "React Development",
    "title": "React Development Roadmap",
    "nodes": [...],
    "edges": [...]
  }
}
```

### POST /api/fetch-resources

Fetches curated resources for a specific node.

**Request:**
```json
{
  "nodeTitle": "React Hooks",
  "nodeTopic": "React Development",
  "nodeDescription": "Learn useState, useEffect, and custom hooks"
}
```

**Response:**
```json
{
  "success": true,
  "resources": [
    {
      "id": "resource_1",
      "type": "youtube",
      "title": "React Hooks Tutorial",
      "url": "https://youtube.com/...",
      "description": "Complete guide to React hooks",
      "source": "freeCodeCamp.org",
      "metadata": {...}
    }
  ]
}
```

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard:
   - `GOOGLE_AI_API_KEY`
   - `YOUTUBE_API_KEY`
   - `SERPER_API_KEY`
5. Deploy

The application will be live at `https://your-project.vercel.app`

## Troubleshooting

### Common Issues

**Issue: API errors when generating roadmap**
- Check that `GOOGLE_AI_API_KEY` is set correctly
- Verify the API key is active in Google AI Studio
- Check browser console for detailed error messages

**Issue: No resources loading for nodes**
- Verify `YOUTUBE_API_KEY` and `SERPER_API_KEY` are set
- Check API quotas (YouTube: 10,000 units/day, Serper: 2,500 searches/month free)
- Check network tab for failed API requests

**Issue: Roadmaps not saving**
- Check if localStorage is available in your browser
- Clear browser cache and try again
- Check browser storage quota

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Powered by [Gemini 2.5 Flash](https://ai.google.dev/)
- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Visualizations with [React Flow](https://reactflow.dev/)
