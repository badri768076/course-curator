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
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      progress: {
        Row: {
          id: string;
          user_id: string;
          course_id: string;
          topic_slug: string;
          completed: boolean;
          video_time: number;
          quiz_score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          course_id: string;
          topic_slug: string;
          completed?: boolean;
          video_time?: number;
          quiz_score?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          course_id?: string;
          topic_slug?: string;
          completed?: boolean;
          video_time?: number;
          quiz_score?: number;
          updated_at?: string;
        };
      };
    };
  };
}
