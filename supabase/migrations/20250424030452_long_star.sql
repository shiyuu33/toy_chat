/*
  # Enable real-time for posts and reactions

  1. Changes
    - Enable real-time for posts table
    - Enable real-time for reactions table
    - Add necessary policies for real-time access

  2. Security
    - Maintain existing RLS policies
    - Add specific policies for real-time events
*/

-- Enable real-time for posts
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Enable real-time for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;

-- Ensure RLS is enabled
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Policy for posts: everyone can read
CREATE POLICY "Anyone can read posts"
ON posts FOR SELECT
TO public
USING (true);

-- Policy for posts: authenticated users can insert
CREATE POLICY "Authenticated users can insert posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for reactions: everyone can read
CREATE POLICY "Anyone can read reactions"
ON reactions FOR SELECT
TO public
USING (true);

-- Policy for reactions: authenticated users can insert/delete their own reactions
CREATE POLICY "Users can manage their own reactions"
ON reactions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);