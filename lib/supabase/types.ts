export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          anonymous_id: string | null
          is_admin: boolean
          display_name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          anonymous_id?: string | null
          is_admin?: boolean
          display_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          anonymous_id?: string | null
          is_admin?: boolean
          display_name?: string | null
        }
      }
      posts: {
        Row: {
          id: string
          created_at: string
          content: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          user_id?: string
        }
      }
      reactions: {
        Row: {
          id: string
          created_at: string
          post_id: string
          user_id: string
          reaction_type: string
        }
        Insert: {
          id?: string
          created_at?: string
          post_id: string
          user_id: string
          reaction_type: string
        }
        Update: {
          id?: string
          created_at?: string
          post_id?: string
          user_id?: string
          reaction_type?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}