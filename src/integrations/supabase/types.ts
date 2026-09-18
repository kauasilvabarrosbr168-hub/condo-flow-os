export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          actor_id: string | null
          condo_id: string
          created_at: string
          id: string
          kind: string
          meta: Json | null
          title: string
        }
        Insert: {
          actor_id?: string | null
          condo_id: string
          created_at?: string
          id?: string
          kind: string
          meta?: Json | null
          title: string
        }
        Update: {
          actor_id?: string | null
          condo_id?: string
          created_at?: string
          id?: string
          kind?: string
          meta?: Json | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_event_log: {
        Row: {
          actions_taken: Json | null
          ai_actions: Json | null
          ai_analysis: string | null
          ai_called: boolean | null
          condo_id: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_context: Json | null
          event_type: string
          id: string
          rules_actions: Json | null
          rules_handled: boolean | null
          severity: string | null
          summary: string
          triggered_at: string | null
        }
        Insert: {
          actions_taken?: Json | null
          ai_actions?: Json | null
          ai_analysis?: string | null
          ai_called?: boolean | null
          condo_id: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_context?: Json | null
          event_type: string
          id?: string
          rules_actions?: Json | null
          rules_handled?: boolean | null
          severity?: string | null
          summary?: string
          triggered_at?: string | null
        }
        Update: {
          actions_taken?: Json | null
          ai_actions?: Json | null
          ai_analysis?: string | null
          ai_called?: boolean | null
          condo_id?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_context?: Json | null
          event_type?: string
          id?: string
          rules_actions?: Json | null
          rules_handled?: boolean | null
          severity?: string | null
          summary?: string
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_event_log_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_task_proposals: {
        Row: {
          ai_reasoning: string | null
          condo_id: string
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          kind: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          task_id: string | null
          title: string
          urgency: string
        }
        Insert: {
          ai_reasoning?: string | null
          condo_id: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          task_id?: string | null
          title: string
          urgency?: string
        }
        Update: {
          ai_reasoning?: string | null
          condo_id?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          task_id?: string | null
          title?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_task_proposals_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_task_proposals_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      area_notices: {
        Row: {
          area_id: string
          author_id: string
          condo_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          area_id: string
          author_id: string
          condo_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          area_id?: string
          author_id?: string
          condo_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_notices_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "common_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_notices_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaning_services: {
        Row: {
          active: boolean
          condo_id: string
          created_at: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          price_cents: number
        }
        Insert: {
          active?: boolean
          condo_id: string
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          price_cents?: number
        }
        Update: {
          active?: boolean
          condo_id?: string
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "cleaning_services_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      common_areas: {
        Row: {
          active: boolean
          available_slots: Json | null
          capacity: number | null
          condo_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          gallery: string[]
          icon: string | null
          id: string
          min_advance_hours: number
          name: string
          requires_checklist: boolean
          rules: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          available_slots?: Json | null
          capacity?: number | null
          condo_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: string[]
          icon?: string | null
          id?: string
          min_advance_hours?: number
          name: string
          requires_checklist?: boolean
          rules?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          available_slots?: Json | null
          capacity?: number | null
          condo_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: string[]
          icon?: string | null
          id?: string
          min_advance_hours?: number
          name?: string
          requires_checklist?: boolean
          rules?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "common_areas_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condo_ai_settings: {
        Row: {
          auto_generate: boolean
          can_change_priority: boolean | null
          can_create_reminders: boolean | null
          can_create_tasks: boolean | null
          can_redistribute_tasks: boolean | null
          condo_id: string
          created_at: string | null
          enabled: boolean | null
          last_auto_gen_at: string | null
          notify_critical: boolean | null
          notify_warning: boolean | null
          whatsapp_phone: string | null
        }
        Insert: {
          auto_generate?: boolean
          can_change_priority?: boolean | null
          can_create_reminders?: boolean | null
          can_create_tasks?: boolean | null
          can_redistribute_tasks?: boolean | null
          condo_id: string
          created_at?: string | null
          enabled?: boolean | null
          last_auto_gen_at?: string | null
          notify_critical?: boolean | null
          notify_warning?: boolean | null
          whatsapp_phone?: string | null
        }
        Update: {
          auto_generate?: boolean
          can_change_priority?: boolean | null
          can_create_reminders?: boolean | null
          can_create_tasks?: boolean | null
          can_redistribute_tasks?: boolean | null
          condo_id?: string
          created_at?: string | null
          enabled?: boolean | null
          last_auto_gen_at?: string | null
          notify_critical?: boolean | null
          notify_warning?: boolean | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "condo_ai_settings_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: true
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condo_garbage_notifications_sent: {
        Row: {
          condo_id: string
          id: string
          notification_type: string
          recipients_count: number
          scheduled_date: string
          sent_at: string
        }
        Insert: {
          condo_id: string
          id?: string
          notification_type: string
          recipients_count?: number
          scheduled_date: string
          sent_at?: string
        }
        Update: {
          condo_id?: string
          id?: string
          notification_type?: string
          recipients_count?: number
          scheduled_date?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condo_garbage_notifications_sent_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condo_garbage_schedule: {
        Row: {
          active: boolean
          collection_time: string
          condo_id: string
          created_at: string
          days_of_week: number[]
          id: string
          notify_1h_before: boolean
          notify_8h_before: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          collection_time?: string
          condo_id: string
          created_at?: string
          days_of_week?: number[]
          id?: string
          notify_1h_before?: boolean
          notify_8h_before?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          collection_time?: string
          condo_id?: string
          created_at?: string
          days_of_week?: number[]
          id?: string
          notify_1h_before?: boolean
          notify_8h_before?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "condo_garbage_schedule_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: true
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condo_holiday_rules: {
        Row: {
          blocked: boolean
          condo_id: string
          created_at: string | null
          holiday_key: string
          id: string
        }
        Insert: {
          blocked?: boolean
          condo_id: string
          created_at?: string | null
          holiday_key: string
          id?: string
        }
        Update: {
          blocked?: boolean
          condo_id?: string
          created_at?: string | null
          holiday_key?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "condo_holiday_rules_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      condominiums: {
        Row: {
          address: string | null
          ai_context: string | null
          ai_onboarded_at: string | null
          blocks_count: number | null
          cleaning_enabled: boolean
          contacts: Json
          cover_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          general_info: string | null
          id: string
          join_code: string
          logo_url: string | null
          name: string
          rules: string | null
          towers_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          ai_context?: string | null
          ai_onboarded_at?: string | null
          blocks_count?: number | null
          cleaning_enabled?: boolean
          contacts?: Json
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          general_info?: string | null
          id?: string
          join_code?: string
          logo_url?: string | null
          name: string
          rules?: string | null
          towers_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          ai_context?: string | null
          ai_onboarded_at?: string | null
          blocks_count?: number | null
          cleaning_enabled?: boolean
          contacts?: Json
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          general_info?: string | null
          id?: string
          join_code?: string
          logo_url?: string | null
          name?: string
          rules?: string | null
          towers_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback_posts: {
        Row: {
          author_id: string
          condo_id: string
          content: string
          created_at: string
          id: string
          kind: string
        }
        Insert: {
          author_id: string
          condo_id: string
          content: string
          created_at?: string
          id?: string
          kind?: string
        }
        Update: {
          author_id?: string
          condo_id?: string
          content?: string
          created_at?: string
          id?: string
          kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_posts_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          condo_id: string
          created_at: string
          email: string
          expires_at: string
          full_name: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          unit_label: string | null
        }
        Insert: {
          accepted_at?: string | null
          condo_id: string
          created_at?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
          token?: string
          unit_label?: string | null
        }
        Update: {
          accepted_at?: string | null
          condo_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          unit_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          contato_preferido: string
          cpf_cnpj: string
          created_at: string
          email: string
          funcionarios: string
          id: string
          interesse: string
          nome: string
          origem: string
          perfil: string
          perfil_outro: string | null
          telefone: string
          unidades: string
        }
        Insert: {
          contato_preferido: string
          cpf_cnpj: string
          created_at?: string
          email: string
          funcionarios: string
          id?: string
          interesse: string
          nome: string
          origem: string
          perfil: string
          perfil_outro?: string | null
          telefone: string
          unidades: string
        }
        Update: {
          contato_preferido?: string
          cpf_cnpj?: string
          created_at?: string
          email?: string
          funcionarios?: string
          id?: string
          interesse?: string
          nome?: string
          origem?: string
          perfil?: string
          perfil_outro?: string | null
          telefone?: string
          unidades?: string
        }
        Relationships: []
      }
      membership_requests: {
        Row: {
          condo_id: string | null
          created_at: string
          decided_admin_at: string | null
          decided_by_admin: string | null
          decided_by_sindico: string | null
          decided_sindico_at: string | null
          id: string
          note: string | null
          proposed_condo_address: string | null
          proposed_condo_name: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"]
          unit_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          condo_id?: string | null
          created_at?: string
          decided_admin_at?: string | null
          decided_by_admin?: string | null
          decided_by_sindico?: string | null
          decided_sindico_at?: string | null
          id?: string
          note?: string | null
          proposed_condo_address?: string | null
          proposed_condo_name?: string | null
          rejection_reason?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          unit_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          condo_id?: string | null
          created_at?: string
          decided_admin_at?: string | null
          decided_by_admin?: string | null
          decided_by_sindico?: string | null
          decided_sindico_at?: string | null
          id?: string
          note?: string | null
          proposed_condo_address?: string | null
          proposed_condo_name?: string | null
          rejection_reason?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          unit_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          code: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          monthly_price_cents: number
          name: string
          unit_limit: number | null
          updated_at: string
          user_limit: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_price_cents?: number
          name: string
          unit_limit?: number | null
          updated_at?: string
          user_limit?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          monthly_price_cents?: number
          name?: string
          unit_limit?: number | null
          updated_at?: string
          user_limit?: number | null
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          meta: Json | null
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          meta?: Json | null
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          condo_id: string | null
          condominium_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          name: string | null
          phone: string | null
          role: string | null
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          condo_id?: string | null
          condominium_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          name?: string | null
          phone?: string | null
          role?: string | null
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          condo_id?: string | null
          condominium_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          role?: string | null
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_tasks: {
        Row: {
          active: boolean
          assignee_id: string | null
          condo_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["task_kind"]
          last_generated_on: string | null
          title: string
          urgency: string
        }
        Insert: {
          active?: boolean
          assignee_id?: string | null
          condo_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["task_kind"]
          last_generated_on?: string | null
          title: string
          urgency?: string
        }
        Update: {
          active?: boolean
          assignee_id?: string | null
          condo_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["task_kind"]
          last_generated_on?: string | null
          title?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_tasks_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          area: string | null
          area_id: string | null
          cleaning_service_id: string | null
          condo_id: string | null
          condominium_id: string | null
          created_at: string | null
          ends_at: string | null
          guests: number | null
          id: string
          notes: string | null
          reservation_date: string | null
          resident_id: string | null
          starts_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          area?: string | null
          area_id?: string | null
          cleaning_service_id?: string | null
          condo_id?: string | null
          condominium_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          guests?: number | null
          id?: string
          notes?: string | null
          reservation_date?: string | null
          resident_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          area?: string | null
          area_id?: string | null
          cleaning_service_id?: string | null
          condo_id?: string | null
          condominium_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          guests?: number | null
          id?: string
          notes?: string | null
          reservation_date?: string | null
          resident_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reservations_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "common_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_cleaning_service_id_fkey"
            columns: ["cleaning_service_id"]
            isOneToOne: false
            referencedRelation: "cleaning_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_logs: {
        Row: {
          condo_id: string
          created_at: string
          done_at: string
          id: string
          notes: string | null
          photo_url: string | null
          task_id: string | null
          title: string
          worker_id: string
        }
        Insert: {
          condo_id: string
          created_at?: string
          done_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          task_id?: string | null
          title: string
          worker_id: string
        }
        Update: {
          condo_id?: string
          created_at?: string
          done_at?: string
          id?: string
          notes?: string | null
          photo_url?: string | null
          task_id?: string | null
          title?: string
          worker_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          condo_id: string
          created_at: string
          current_period_end: string | null
          discount_pct: number
          id: string
          notes: string | null
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          condo_id: string
          created_at?: string
          current_period_end?: string | null
          discount_pct?: number
          id?: string
          notes?: string | null
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          condo_id?: string
          created_at?: string
          current_period_end?: string | null
          discount_pct?: number
          id?: string
          notes?: string | null
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          condo_id: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
        }
        Insert: {
          condo_id: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
        }
        Update: {
          condo_id?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_generated: boolean
          assigned_to: string | null
          assignee_id: string | null
          checklist: Json
          completed_at: string | null
          condo_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_at: string | null
          estimated_minutes: number | null
          id: string
          kind: string | null
          location: string | null
          notify_immediately: boolean
          recurring_task_id: string | null
          reservation_id: string | null
          status: string | null
          title: string | null
          urgency: string
        }
        Insert: {
          ai_generated?: boolean
          assigned_to?: string | null
          assignee_id?: string | null
          checklist?: Json
          completed_at?: string | null
          condo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          kind?: string | null
          location?: string | null
          notify_immediately?: boolean
          recurring_task_id?: string | null
          reservation_id?: string | null
          status?: string | null
          title?: string | null
          urgency?: string
        }
        Update: {
          ai_generated?: boolean
          assigned_to?: string | null
          assignee_id?: string | null
          checklist?: Json
          completed_at?: string | null
          condo_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          estimated_minutes?: number | null
          id?: string
          kind?: string | null
          location?: string | null
          notify_immediately?: boolean
          recurring_task_id?: string | null
          reservation_id?: string | null
          status?: string | null
          title?: string | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurring_task_id_fkey"
            columns: ["recurring_task_id"]
            isOneToOne: false
            referencedRelation: "recurring_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          condo_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          condo_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          condo_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_notes: {
        Row: {
          completed: boolean
          completed_at: string | null
          condo_id: string
          content: string
          created_at: string
          id: string
          remind_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          condo_id: string
          content: string
          created_at?: string
          id?: string
          remind_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          condo_id?: string
          content?: string
          created_at?: string
          id?: string
          remind_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_notes_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_member_to_condo: {
        Args: {
          p_condo_id: string
          p_role: string
          p_unit_label?: string
          p_user_id: string
        }
        Returns: undefined
      }
      claim_first_platform_admin: { Args: never; Returns: boolean }
      decide_membership_request: {
        Args: { p_decision: string; p_reason?: string; p_request_id: string }
        Returns: {
          condo_id: string | null
          created_at: string
          decided_admin_at: string | null
          decided_by_admin: string | null
          decided_by_sindico: string | null
          decided_sindico_at: string | null
          id: string
          note: string | null
          proposed_condo_address: string | null
          proposed_condo_name: string | null
          rejection_reason: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["membership_status"]
          unit_label: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "membership_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      find_condo_by_join_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      is_condo_admin: {
        Args: { _condo_id: string; _user_id: string }
        Returns: boolean
      }
      is_condo_member: {
        Args: { _condo_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      list_condos_for_signup: {
        Args: never
        Returns: {
          address: string
          id: string
          name: string
        }[]
      }
      regenerate_condo_join_code: {
        Args: { p_condo_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "sindico" | "administradora" | "morador" | "funcionario"
      membership_status:
        | "pending"
        | "sindico_approved"
        | "approved"
        | "rejected"
      reservation_status:
        | "pendente"
        | "confirmada"
        | "em_execucao"
        | "concluida"
        | "cancelada"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "suspended"
        | "canceled"
      task_kind:
        | "pre_checklist"
        | "pos_checklist"
        | "manutencao"
        | "incidente"
        | "limpeza"
        | "verificacao"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      ticket_priority: "urgent" | "high" | "medium" | "low"
      ticket_status: "open" | "pending" | "resolved" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["sindico", "administradora", "morador", "funcionario"],
      membership_status: [
        "pending",
        "sindico_approved",
        "approved",
        "rejected",
      ],
      reservation_status: [
        "pendente",
        "confirmada",
        "em_execucao",
        "concluida",
        "cancelada",
      ],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "suspended",
        "canceled",
      ],
      task_kind: [
        "pre_checklist",
        "pos_checklist",
        "manutencao",
        "incidente",
        "limpeza",
        "verificacao",
      ],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      ticket_priority: ["urgent", "high", "medium", "low"],
      ticket_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
