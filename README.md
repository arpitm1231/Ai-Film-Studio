# Ai-Film-Studio
AI Film Studio is an AI-powered filmmaking platform that streamlines the entire content production workflow—from story creation and script writing to AI-generated visuals, audio, trailer production, project management, and performance analytics—all within a modern web application.



# 🎬 AI Film Studio

An AI-powered pipeline that takes a story idea and turns it into a full pre-production package — screenplay, scene visuals, voiceover and music, a trailer, and production analytics — all in one guided workflow.

Built with React + TypeScript + Vite on the frontend, and Supabase (Postgres, Auth, Storage, Edge Functions) on the backend.

## How it works

Each project moves through six stages, shown as numbered frames in the sidebar:

| Stage | What happens |
|---|---|
| **01 · Story** | Enter a title and a story idea/premise. |
| **02 · Script** | AI generates a full screenplay: logline, characters, and scene-by-scene breakdown (location, time of day, mood, dialogue, duration). Scenes are editable after generation. |
| **03 · Visuals** | AI generates a concept image for each scene based on its visual description. |
| **04 · Audio** | AI generates voiceover narration and background music per scene. |
| **05 · Trailer** | AI assembles a trailer asset from the project's story and scenes. |
| **06 · Analytics** | AI produces a production analysis: budget estimate, shooting schedule, filming locations, audience/success prediction, and sentiment/market-reach scoring. |

Projects, screenplays, scenes, generated assets, and production analytics all persist to Supabase, so you can leave and resume a project at any stage. A command palette (`Cmd/Ctrl+K`) provides quick navigation between stages and projects.

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, lucide-react icons
- **Backend:** Supabase (Postgres with Row Level Security, Auth, Storage)
- **AI generation:** Supabase Edge Functions (Deno), one per generation step:
  - `generate-screenplay` — OpenAI
  - `generate-visuals` — Stability AI, with DALL·E and stock-photo fallbacks
  - `generate-voiceover` — ElevenLabs
  - `generate-music`
  - `generate-trailer`
  - `generate-analytics` — OpenAI

All generation functions are designed to degrade gracefully: if a given API key isn't configured, the app falls back to placeholder/stock content rather than failing outright.

## Data model

Defined in `supabase/migrations/`:

- **projects** — one row per film project (title, story idea, current stage)
- **screenplays** — generated screenplay for a project (logline, characters, raw AI JSON)
- **scenes** — individual scenes belonging to a screenplay (location, mood, dialogue, duration)
- **assets** — generated media (image, voiceover, music, trailer), linked to a project and optionally a scene
- **productions** — analytics output (budget, schedule, locations, success prediction, sentiment score, market reach)

Row Level Security is enabled on every table; users can only read/write their own data.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Set up Supabase

- Run the SQL migrations in `supabase/migrations/` against your Supabase project (via the Supabase CLI or SQL editor) to create the schema and storage policies.
- Deploy the Edge Functions in `supabase/functions/` to your Supabase project.
- In your Supabase project's Edge Function secrets, set whichever AI provider keys you want to enable:

```bash
OPENAI_API_KEY=...
STABILITY_API_KEY=...
ELEVENLABS_API_KEY=...
```

The app works with these left empty — it just falls back to placeholder content for the corresponding step.

### 4. Run the dev server

```bash
npm run dev
```

### Other scripts

```bash
npm run build      # production build
npm run preview    # preview the production build locally
npm run lint        # run ESLint
npm run typecheck   # run TypeScript in --noEmit mode
```

## Project structure

```
src/
├── components/       # Shared UI: auth page, sidebar, command palette, toasts, dialogs
├── hooks/            # useAuth (Supabase auth state)
├── lib/              # Supabase client
├── pages/            # One page per pipeline stage (Dashboard, Projects, Story,
│                      # Script, Visuals, Audio, Trailer, Analytics)
├── App.tsx           # Stage routing / top-level layout
└── main.tsx          # Entry point

supabase/
├── functions/        # Edge Functions, one per AI generation step
└── migrations/        # Database schema + storage policies
```

## Notes

- Authentication is handled via Supabase Auth (see `AuthPage.tsx` / `useAuth.tsx`).
- The `.env` file is git-ignored; don't commit real API keys.
