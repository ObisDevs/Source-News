# Source-News

Source-News is a Nigerian-focused news intelligence platform that aggregates, clusters, and analyzes news from multiple sources using AI-powered bias detection, sentiment analysis, and viewpoint comparison. Built on Next.js 15, Supabase, and multi-AI orchestration.

## Getting Started

### Prerequisites
- Node.js 20+
- npm or yarn
- Supabase account
- API keys for AI providers (Gemini, OpenAI, etc.)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Copy `.env.local.example` to `.env.local` and fill in your credentials:
```bash
cp .env.local.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Database Setup

1. Create a Supabase project
2. Enable the pgvector extension
3. Run the SQL from `DATABASE_SCHEMA.md` in the Supabase SQL editor

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   └── ui/          # UI components (ShadCN)
└── lib/             # Core libraries
    ├── supabase/    # Database clients
    ├── ai/          # AI orchestration
    ├── redis/       # Caching layer
    ├── workers/     # Background jobs
    ├── embeddings/  # Vector embeddings
    ├── clustering/  # Story clustering
    └── types/       # TypeScript types
```

## Development Milestones

See `DEVELOPMENT_MILESTONES.md` for the complete 7-stage development plan.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS v4
- **Backend**: Supabase (PostgreSQL + pgvector)
- **AI**: Google Gemini, OpenAI, Groq, xAI Grok
- **Caching**: Vercel KV / Upstash Redis
- **Deployment**: Vercel

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - All rights reserved
