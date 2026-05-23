export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      chores: {
        Row: {
          active: boolean;
          created_at: string;
          family_id: string;
          id: string;
          kid_id: string;
          kind: string;
          reference_photo_path: string | null;
          title: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          family_id: string;
          id?: string;
          kid_id: string;
          kind?: string;
          reference_photo_path?: string | null;
          title: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          family_id?: string;
          id?: string;
          kid_id?: string;
          kind?: string;
          reference_photo_path?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'chores_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'chores_kid_id_fkey';
            columns: ['kid_id'];
            isOneToOne: false;
            referencedRelation: 'family_members';
            referencedColumns: ['id'];
          },
        ];
      };
      families: {
        Row: {
          created_at: string;
          id: string;
          invite_code_used: string | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_code_used?: string | null;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_code_used?: string | null;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'families_invite_code_used_fkey';
            columns: ['invite_code_used'];
            isOneToOne: false;
            referencedRelation: 'invite_codes';
            referencedColumns: ['code'];
          },
        ];
      };
      family_members: {
        Row: {
          auth_user_id: string | null;
          created_at: string;
          display_name: string;
          family_id: string;
          id: string;
          role: Database['public']['Enums']['member_role'];
        };
        Insert: {
          auth_user_id?: string | null;
          created_at?: string;
          display_name: string;
          family_id: string;
          id?: string;
          role: Database['public']['Enums']['member_role'];
        };
        Update: {
          auth_user_id?: string | null;
          created_at?: string;
          display_name?: string;
          family_id?: string;
          id?: string;
          role?: Database['public']['Enums']['member_role'];
        };
        Relationships: [
          {
            foreignKeyName: 'family_members_family_id_fkey';
            columns: ['family_id'];
            isOneToOne: false;
            referencedRelation: 'families';
            referencedColumns: ['id'];
          },
        ];
      };
      invite_codes: {
        Row: {
          code: string;
          created_at: string;
          expires_at: string | null;
          issued_to_label: string | null;
          max_uses: number;
          revoked: boolean;
          times_used: number;
        };
        Insert: {
          code: string;
          created_at?: string;
          expires_at?: string | null;
          issued_to_label?: string | null;
          max_uses?: number;
          revoked?: boolean;
          times_used?: number;
        };
        Update: {
          code?: string;
          created_at?: string;
          expires_at?: string | null;
          issued_to_label?: string | null;
          max_uses?: number;
          revoked?: boolean;
          times_used?: number;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          ai_evaluated_at: string | null;
          ai_feedback: string | null;
          ai_verdict: Database['public']['Enums']['ai_verdict'] | null;
          chore_id: string;
          id: string;
          parent_override: Database['public']['Enums']['override_kind'] | null;
          parent_override_at: string | null;
          parent_override_by: string | null;
          parent_override_reason:
            | Database['public']['Enums']['override_reason']
            | null;
          photo_path: string;
          status: Database['public']['Enums']['submission_status'];
          submitted_at: string;
          submitted_by: string | null;
        };
        Insert: {
          ai_evaluated_at?: string | null;
          ai_feedback?: string | null;
          ai_verdict?: Database['public']['Enums']['ai_verdict'] | null;
          chore_id: string;
          id?: string;
          parent_override?: Database['public']['Enums']['override_kind'] | null;
          parent_override_at?: string | null;
          parent_override_by?: string | null;
          parent_override_reason?:
            | Database['public']['Enums']['override_reason']
            | null;
          photo_path: string;
          status?: Database['public']['Enums']['submission_status'];
          submitted_at?: string;
          submitted_by?: string | null;
        };
        Update: {
          ai_evaluated_at?: string | null;
          ai_feedback?: string | null;
          ai_verdict?: Database['public']['Enums']['ai_verdict'] | null;
          chore_id?: string;
          id?: string;
          parent_override?: Database['public']['Enums']['override_kind'] | null;
          parent_override_at?: string | null;
          parent_override_by?: string | null;
          parent_override_reason?:
            | Database['public']['Enums']['override_reason']
            | null;
          photo_path?: string;
          status?: Database['public']['Enums']['submission_status'];
          submitted_at?: string;
          submitted_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'submissions_chore_id_fkey';
            columns: ['chore_id'];
            isOneToOne: false;
            referencedRelation: 'chores';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_parent_override_by_fkey';
            columns: ['parent_override_by'];
            isOneToOne: false;
            referencedRelation: 'family_members';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'submissions_submitted_by_fkey';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'family_members';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      current_user_family_id: { Args: never; Returns: string };
      current_user_is_parent: { Args: never; Returns: boolean };
      peek_invite_code: { Args: { p_code: string }; Returns: boolean };
      redeem_invite_and_create_family: {
        Args: {
          p_code: string;
          p_family_name: string;
          p_parent_display_name: string;
        };
        Returns: string;
      };
    };
    Enums: {
      ai_verdict: 'pass' | 'needs_work';
      member_role: 'parent' | 'kid';
      override_kind: 'approved' | 'rejected';
      override_reason: 'good_enough_today' | 'worked_hard' | 'help_with_rest';
      submission_status: 'pending_ai' | 'pending_parent' | 'complete';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
