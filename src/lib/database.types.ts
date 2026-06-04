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
          coaching_tips: string[];
          created_at: string;
          family_id: string;
          id: string;
          is_optional: boolean;
          kid_id: string;
          kind: string;
          recurrence_days: number[];
          recurrence_type: Database['public']['Enums']['recurrence_type'];
          reference_photo_path: string | null;
          reward_weight: number;
          starts_on: string;
          title: string;
          verification_kind: Database['public']['Enums']['verification_kind'];
        };
        Insert: {
          active?: boolean;
          coaching_tips?: string[];
          created_at?: string;
          family_id: string;
          id?: string;
          is_optional?: boolean;
          kid_id: string;
          kind?: string;
          recurrence_days?: number[];
          recurrence_type?: Database['public']['Enums']['recurrence_type'];
          reference_photo_path?: string | null;
          reward_weight?: number;
          starts_on?: string;
          title: string;
          verification_kind?: Database['public']['Enums']['verification_kind'];
        };
        Update: {
          active?: boolean;
          coaching_tips?: string[];
          created_at?: string;
          family_id?: string;
          id?: string;
          is_optional?: boolean;
          kid_id?: string;
          kind?: string;
          recurrence_days?: number[];
          recurrence_type?: Database['public']['Enums']['recurrence_type'];
          reference_photo_path?: string | null;
          reward_weight?: number;
          starts_on?: string;
          title?: string;
          verification_kind?: Database['public']['Enums']['verification_kind'];
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
      chore_instances: {
        Row: {
          chore_id: string;
          completed_at: string | null;
          created_at: string;
          due_date: string;
          family_id: string;
          id: string;
          kid_id: string;
          status: Database['public']['Enums']['instance_status'];
        };
        Insert: {
          chore_id: string;
          completed_at?: string | null;
          created_at?: string;
          due_date: string;
          family_id: string;
          id?: string;
          kid_id: string;
          status?: Database['public']['Enums']['instance_status'];
        };
        Update: {
          chore_id?: string;
          completed_at?: string | null;
          created_at?: string;
          due_date?: string;
          family_id?: string;
          id?: string;
          kid_id?: string;
          status?: Database['public']['Enums']['instance_status'];
        };
        Relationships: [];
      };
      families: {
        Row: {
          created_at: string;
          id: string;
          invite_code_used: string | null;
          name: string;
          parent_welcomed_at: string | null;
          reward_mode: string;
          week_one_checkin_answer:
            | Database['public']['Enums']['week_one_answer']
            | null;
          week_one_checkin_answered_at: string | null;
          week_one_checkin_shown_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          invite_code_used?: string | null;
          name: string;
          parent_welcomed_at?: string | null;
          reward_mode?: string;
          week_one_checkin_answer?:
            | Database['public']['Enums']['week_one_answer']
            | null;
          week_one_checkin_answered_at?: string | null;
          week_one_checkin_shown_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          invite_code_used?: string | null;
          name?: string;
          parent_welcomed_at?: string | null;
          reward_mode?: string;
          week_one_checkin_answer?:
            | Database['public']['Enums']['week_one_answer']
            | null;
          week_one_checkin_answered_at?: string | null;
          week_one_checkin_shown_at?: string | null;
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
          age: number | null;
          auth_user_id: string | null;
          created_at: string;
          display_name: string;
          family_id: string;
          id: string;
          kid_join_code: string | null;
          kid_join_code_expires_at: string | null;
          kid_joined_at: string | null;
          kid_mode: Database['public']['Enums']['kid_mode'];
          neurodivergence_context: Database['public']['Enums']['neurodivergence_context'];
          role: Database['public']['Enums']['member_role'];
        };
        Insert: {
          age?: number | null;
          auth_user_id?: string | null;
          created_at?: string;
          display_name: string;
          family_id: string;
          id?: string;
          kid_join_code?: string | null;
          kid_join_code_expires_at?: string | null;
          kid_joined_at?: string | null;
          kid_mode?: Database['public']['Enums']['kid_mode'];
          neurodivergence_context?: Database['public']['Enums']['neurodivergence_context'];
          role: Database['public']['Enums']['member_role'];
        };
        Update: {
          age?: number | null;
          auth_user_id?: string | null;
          created_at?: string;
          display_name?: string;
          family_id?: string;
          id?: string;
          kid_join_code?: string | null;
          kid_join_code_expires_at?: string | null;
          kid_joined_at?: string | null;
          kid_mode?: Database['public']['Enums']['kid_mode'];
          neurodivergence_context?: Database['public']['Enums']['neurodivergence_context'];
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
      parent_nudges: {
        Row: {
          id: string;
          family_id: string;
          parent_id: string;
          kid_id: string;
          nudged_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          parent_id: string;
          kid_id: string;
          nudged_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          parent_id?: string;
          kid_id?: string;
          nudged_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          ai_evaluated_at: string | null;
          ai_feedback: string | null;
          ai_verdict: Database['public']['Enums']['ai_verdict'] | null;
          chore_id: string;
          chore_instance_id: string | null;
          id: string;
          parent_override: Database['public']['Enums']['override_kind'] | null;
          parent_override_at: string | null;
          parent_override_by: string | null;
          parent_override_reason:
            | Database['public']['Enums']['override_reason']
            | null;
          photo_path: string | null;
          status: Database['public']['Enums']['submission_status'];
          submitted_at: string;
          submitted_by: string | null;
        };
        Insert: {
          ai_evaluated_at?: string | null;
          ai_feedback?: string | null;
          ai_verdict?: Database['public']['Enums']['ai_verdict'] | null;
          chore_id: string;
          chore_instance_id?: string | null;
          id?: string;
          parent_override?: Database['public']['Enums']['override_kind'] | null;
          parent_override_at?: string | null;
          parent_override_by?: string | null;
          parent_override_reason?:
            | Database['public']['Enums']['override_reason']
            | null;
          photo_path?: string | null;
          status?: Database['public']['Enums']['submission_status'];
          submitted_at?: string;
          submitted_by?: string | null;
        };
        Update: {
          ai_evaluated_at?: string | null;
          ai_feedback?: string | null;
          ai_verdict?: Database['public']['Enums']['ai_verdict'] | null;
          chore_id?: string;
          chore_instance_id?: string | null;
          id?: string;
          parent_override?: Database['public']['Enums']['override_kind'] | null;
          parent_override_at?: string | null;
          parent_override_by?: string | null;
          parent_override_reason?:
            | Database['public']['Enums']['override_reason']
            | null;
          photo_path?: string | null;
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
      apply_parent_override: {
        Args: {
          p_submission_id: string;
          p_override: Database['public']['Enums']['override_kind'];
          p_reason: Database['public']['Enums']['override_reason'] | null;
        };
        Returns: void;
      };
      clear_parent_override: {
        Args: { p_submission_id: string };
        Returns: void;
      };
      current_user_family_id: { Args: never; Returns: string };
      current_user_is_parent: { Args: never; Returns: boolean };
      ensure_chore_instances_for_date: {
        Args: { p_family_id: string; p_due_date: string };
        Returns: void;
      };
      generate_kid_join_code: {
        Args: { p_kid_id: string };
        Returns: string;
      };
      kid_link_with_join_code: {
        Args: { p_code: string };
        Returns: {
          family_member_id: string;
          family_id: string;
          display_name: string;
        }[];
      };
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
      instance_status:
        | 'open'
        | 'submitted'
        | 'awaiting_parent'
        | 'passed'
        | 'complete'
        | 'missed';
      kid_mode: 'auto' | 'kid' | 'teen' | 'peer';
      member_role: 'parent' | 'kid';
      neurodivergence_context: 'not_specified' | 'neurotypical' | 'neurodivergent';
      override_kind: 'approved' | 'rejected';
      override_reason: 'good_enough_today' | 'worked_hard' | 'help_with_rest';
      recurrence_type: 'none' | 'daily' | 'weekly';
      submission_status: 'pending_ai' | 'pending_parent' | 'complete';
      verification_kind: 'photo' | 'checklist';
      week_one_answer: 'less_conflict' | 'about_the_same' | 'more_conflict';
    };
    CompositeTypes: { [_ in never]: never };
  };
};
