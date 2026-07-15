/*
  # AI Film Studio - Core Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text, project title)
      - `story_idea` (text, user's original story input)
      - `status` (text, current production stage)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `screenplays`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `title` (text)
      - `genre` (text)
      - `logline` (text)
      - `characters` (jsonb, character descriptions)
      - `raw_json` (jsonb, full screenplay JSON from AI)
      - `created_at` (timestamptz)

    - `scenes`
      - `id` (uuid, primary key)
      - `screenplay_id` (uuid, references screenplays)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `scene_number` (integer)
      - `location` (text)
      - `time_of_day` (text)
      - `description` (text)
      - `visual_description` (text)
      - `dialogue` (jsonb, array of dialogue lines)
      - `mood` (text)
      - `duration_seconds` (integer, estimated duration)
      - `created_at` (timestamptz)

    - `assets`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `scene_id` (uuid, references scenes, nullable)
      - `user_id` (uuid, references auth.users)
      - `asset_type` (text, one of: image, voiceover, music, trailer)
      - `url` (text, storage URL)
      - `metadata` (jsonb, additional info like duration, prompt, etc.)
      - `status` (text, one of: pending, generating, completed, failed)
      - `created_at` (timestamptz)

    - `productions`
      - `id` (uuid, primary key)
      - `project_id` (uuid, references projects)
      - `user_id` (uuid, references auth.users)
      - `budget_estimate` (jsonb, budget breakdown)
      - `schedule` (jsonb, 30-day filming schedule)
      - `locations` (jsonb, location list)
      - `success_prediction` (jsonb, audience success analysis)
      - `sentiment_score` (numeric, 0-100)
      - `market_reach` (text, predicted market reach)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data (user_id check)
    - All policies restrict to authenticated users only
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  story_idea text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'story',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Screenplays table
CREATE TABLE IF NOT EXISTS screenplays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  genre text NOT NULL DEFAULT '',
  logline text NOT NULL DEFAULT '',
  characters jsonb NOT NULL DEFAULT '[]',
  raw_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE screenplays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own screenplays"
  ON screenplays FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own screenplays"
  ON screenplays FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screenplays"
  ON screenplays FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own screenplays"
  ON screenplays FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Scenes table
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screenplay_id uuid NOT NULL REFERENCES screenplays(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scene_number integer NOT NULL DEFAULT 0,
  location text NOT NULL DEFAULT '',
  time_of_day text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  visual_description text NOT NULL DEFAULT '',
  dialogue jsonb NOT NULL DEFAULT '[]',
  mood text NOT NULL DEFAULT '',
  duration_seconds integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scenes"
  ON scenes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scenes"
  ON scenes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scenes"
  ON scenes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scenes"
  ON scenes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_id uuid REFERENCES scenes(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'image',
  url text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Productions table
CREATE TABLE IF NOT EXISTS productions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  budget_estimate jsonb NOT NULL DEFAULT '{}',
  schedule jsonb NOT NULL DEFAULT '{}',
  locations jsonb NOT NULL DEFAULT '[]',
  success_prediction jsonb NOT NULL DEFAULT '{}',
  sentiment_score numeric DEFAULT 0,
  market_reach text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE productions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own productions"
  ON productions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own productions"
  ON productions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own productions"
  ON productions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own productions"
  ON productions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_screenplays_project_id ON screenplays(project_id);
CREATE INDEX IF NOT EXISTS idx_scenes_screenplay_id ON scenes(screenplay_id);
CREATE INDEX IF NOT EXISTS idx_scenes_project_id ON scenes(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_scene_id ON assets(scene_id);
CREATE INDEX IF NOT EXISTS idx_productions_project_id ON productions(project_id);
