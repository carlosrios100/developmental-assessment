// Supabase Database Types
// This file should be regenerated with: pnpm db:generate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'parent' | 'caregiver' | 'professional' | 'admin'
          profile_photo_url: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'parent' | 'caregiver' | 'professional' | 'admin'
          profile_photo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'parent' | 'caregiver' | 'professional' | 'admin'
          profile_photo_url?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          id: string
          parent_user_id: string
          first_name: string
          last_name: string | null
          date_of_birth: string
          gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          premature_weeks: number
          photo_url: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_user_id: string
          first_name: string
          last_name?: string | null
          date_of_birth: string
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          premature_weeks?: number
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_user_id?: string
          first_name?: string
          last_name?: string | null
          date_of_birth?: string
          gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
          premature_weeks?: number
          photo_url?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          id: string
          child_id: string
          age_at_assessment: number
          questionnaire_version: number
          status: 'draft' | 'in_progress' | 'completed' | 'archived'
          completed_by: 'parent' | 'caregiver' | 'professional' | 'admin'
          completed_by_user_id: string | null
          started_at: string
          completed_at: string | null
          overall_risk_level: 'typical' | 'monitoring' | 'at_risk' | 'concern' | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          age_at_assessment: number
          questionnaire_version: number
          status?: 'draft' | 'in_progress' | 'completed' | 'archived'
          completed_by?: 'parent' | 'caregiver' | 'professional' | 'admin'
          completed_by_user_id?: string | null
          started_at?: string
          completed_at?: string | null
          overall_risk_level?: 'typical' | 'monitoring' | 'at_risk' | 'concern' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          age_at_assessment?: number
          questionnaire_version?: number
          status?: 'draft' | 'in_progress' | 'completed' | 'archived'
          completed_by?: 'parent' | 'caregiver' | 'professional' | 'admin'
          completed_by_user_id?: string | null
          started_at?: string
          completed_at?: string | null
          overall_risk_level?: 'typical' | 'monitoring' | 'at_risk' | 'concern' | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      questionnaire_responses: {
        Row: {
          id: string
          assessment_id: string
          item_id: string
          response: 'yes' | 'sometimes' | 'not_yet'
          response_value: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          item_id: string
          response: 'yes' | 'sometimes' | 'not_yet'
          response_value: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          item_id?: string
          response?: 'yes' | 'sometimes' | 'not_yet'
          response_value?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      domain_scores: {
        Row: {
          id: string
          assessment_id: string
          domain: string
          raw_score: number
          max_score: number
          percentile: number | null
          z_score: number | null
          risk_level: 'typical' | 'monitoring' | 'at_risk' | 'concern'
          cutoff_score: number
          monitoring_zone_cutoff: number
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          domain: string
          raw_score: number
          max_score?: number
          percentile?: number | null
          z_score?: number | null
          risk_level: 'typical' | 'monitoring' | 'at_risk' | 'concern'
          cutoff_score: number
          monitoring_zone_cutoff: number
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          domain?: string
          raw_score?: number
          max_score?: number
          percentile?: number | null
          z_score?: number | null
          risk_level?: 'typical' | 'monitoring' | 'at_risk' | 'concern'
          cutoff_score?: number
          monitoring_zone_cutoff?: number
          created_at?: string
        }
        Relationships: []
      }
      video_uploads: {
        Row: {
          id: string
          child_id: string
          assessment_id: string | null
          uploaded_by_user_id: string
          file_name: string
          file_size: number
          duration: number
          context: 'free_play' | 'structured_activity' | 'caregiver_interaction' | 'feeding' | 'book_reading' | 'physical_activity' | 'peer_interaction' | 'self_care_routine'
          recorded_at: string
          storage_path: string
          storage_url: string | null
          thumbnail_path: string | null
          thumbnail_url: string | null
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          processing_started_at: string | null
          processing_completed_at: string | null
          processing_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          assessment_id?: string | null
          uploaded_by_user_id: string
          file_name: string
          file_size: number
          duration: number
          context: 'free_play' | 'structured_activity' | 'caregiver_interaction' | 'feeding' | 'book_reading' | 'physical_activity' | 'peer_interaction' | 'self_care_routine'
          recorded_at: string
          storage_path: string
          storage_url?: string | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_started_at?: string | null
          processing_completed_at?: string | null
          processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          assessment_id?: string | null
          uploaded_by_user_id?: string
          file_name?: string
          file_size?: number
          duration?: number
          context?: 'free_play' | 'structured_activity' | 'caregiver_interaction' | 'feeding' | 'book_reading' | 'physical_activity' | 'peer_interaction' | 'self_care_routine'
          recorded_at?: string
          storage_path?: string
          storage_url?: string | null
          thumbnail_path?: string | null
          thumbnail_url?: string | null
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          processing_started_at?: string | null
          processing_completed_at?: string | null
          processing_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      video_analysis_results: {
        Row: {
          id: string
          video_id: string
          analyzed_at: string
          duration: number
          confidence: number | null
          movement_metrics: Json | null
          interaction_metrics: Json | null
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          analyzed_at?: string
          duration: number
          confidence?: number | null
          movement_metrics?: Json | null
          interaction_metrics?: Json | null
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          analyzed_at?: string
          duration?: number
          confidence?: number | null
          movement_metrics?: Json | null
          interaction_metrics?: Json | null
          raw_data?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          id: string
          assessment_id: string
          priority: 'high' | 'medium' | 'low'
          domain: string
          type: 'activity' | 'referral' | 'monitoring' | 'reassessment'
          title: string
          description: string
          activities: Json | null
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          priority: 'high' | 'medium' | 'low'
          domain: string
          type: 'activity' | 'referral' | 'monitoring' | 'reassessment'
          title: string
          description: string
          activities?: Json | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          priority?: 'high' | 'medium' | 'low'
          domain?: string
          type?: 'activity' | 'referral' | 'monitoring' | 'reassessment'
          title?: string
          description?: string
          activities?: Json | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      milestone_progress: {
        Row: {
          id: string
          child_id: string
          milestone_id: string
          status: 'not_started' | 'emerging' | 'achieved'
          first_observed_at: string | null
          achieved_at: string | null
          video_evidence_ids: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          child_id: string
          milestone_id: string
          status?: 'not_started' | 'emerging' | 'achieved'
          first_observed_at?: string | null
          achieved_at?: string | null
          video_evidence_ids?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          child_id?: string
          milestone_id?: string
          status?: 'not_started' | 'emerging' | 'achieved'
          first_observed_at?: string | null
          achieved_at?: string | null
          video_evidence_ids?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          assessment_id: string
          child_id: string
          generated_by_user_id: string | null
          type: 'parent_summary' | 'professional_detailed' | 'referral' | 'progress_comparison' | 'video_analysis'
          format: 'pdf' | 'html' | 'json'
          storage_path: string | null
          storage_url: string | null
          content: Json | null
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          assessment_id: string
          child_id: string
          generated_by_user_id?: string | null
          type: 'parent_summary' | 'professional_detailed' | 'referral' | 'progress_comparison' | 'video_analysis'
          format: 'pdf' | 'html' | 'json'
          storage_path?: string | null
          storage_url?: string | null
          content?: Json | null
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          assessment_id?: string
          child_id?: string
          generated_by_user_id?: string | null
          type?: 'parent_summary' | 'professional_detailed' | 'referral' | 'progress_comparison' | 'video_analysis'
          format?: 'pdf' | 'html' | 'json'
          storage_path?: string | null
          storage_url?: string | null
          content?: Json | null
          expires_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'parent' | 'caregiver' | 'professional' | 'admin'
      gender_type: 'male' | 'female' | 'other' | 'prefer_not_to_say'
      response_value: 'yes' | 'sometimes' | 'not_yet'
      risk_level: 'typical' | 'monitoring' | 'at_risk' | 'concern'
      assessment_status: 'draft' | 'in_progress' | 'completed' | 'archived'
      video_processing_status: 'pending' | 'processing' | 'completed' | 'failed'
      video_context: 'free_play' | 'structured_activity' | 'caregiver_interaction' | 'feeding' | 'book_reading' | 'physical_activity' | 'peer_interaction' | 'self_care_routine'
      recommendation_type: 'activity' | 'referral' | 'monitoring' | 'reassessment'
      recommendation_priority: 'high' | 'medium' | 'low'
      report_type: 'parent_summary' | 'professional_detailed' | 'referral' | 'progress_comparison' | 'video_analysis'
      report_format: 'pdf' | 'html' | 'json'
      milestone_status: 'not_started' | 'emerging' | 'achieved'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
