/*
  # Initial database schema

  1. Tables
    - users: ユーザー情報を管理
      - id: プライマリーキー (UUID)
      - created_at: 作成日時
      - anonymous_id: 匿名ユーザーID (オプション)
      - is_admin: 管理者フラグ
      - display_name: 表示名
    
    - posts: 投稿を管理
      - id: プライマリーキー (UUID)
      - created_at: 作成日時
      - content: 投稿内容
      - user_id: 投稿者ID (外部キー)
    
    - reactions: リアクションを管理
      - id: プライマリーキー (UUID)
      - created_at: 作成日時
      - post_id: 投稿ID (外部キー)
      - user_id: リアクションしたユーザーID (外部キー)
      - reaction_type: リアクションの種類

  2. Security
    - すべてのテーブルでRLSを有効化
    - 適切なポリシーを設定
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  anonymous_id text,
  is_admin boolean DEFAULT false,
  display_name text
);

-- Create posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create reactions table
CREATE TABLE reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type text NOT NULL
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read all users"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Posts policies
CREATE POLICY "Anyone can read posts"
  ON posts FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can insert their own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can delete their own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true)
  );

-- Reactions policies
CREATE POLICY "Anyone can read reactions"
  ON reactions FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own reactions"
  ON reactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);