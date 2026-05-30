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
      common_areas: {
        Row: {
          active: boolean
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
      condominiums: {
        Row: {
          address: string | null
          blocks_count: number | null
          contacts: Json
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          general_info: string | null
          id: string
          logo_url: string | null
          name: string
          rules: string | null
          towers_count: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          blocks_count?: number | null
          contacts?: Json
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          general_info?: string | null
          id?: string
          logo_url?: string | null
          name: string
          rules?: string | null
          towers_count?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          blocks_count?: number | null
          contacts?: Json
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          general_info?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          rules?: string | null
          towers_count?: number | null
          updated_at?: string
        }
        Relationships: []
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
          admin_user_id: string
          created_at: string
          id: string
          ip: string | null
          meta: Json
          target_id: string | null
          target_kind: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip?: string | null
          meta?: Json
          target_id?: string | null
          target_kind?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip?: string | null
          meta?: Json
          target_id?: string | null
          target_kind?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          condo_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          unit_label: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          condo_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          unit_label?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          condo_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          unit_label?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          area_id: string
          condo_id: string
          created_at: string
          ends_at: string
          guests: number | null
          id: string
          notes: string | null
          resident_id: string
          starts_at: string
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          area_id: string
          condo_id: string
          created_at?: string
          ends_at: string
          guests?: number | null
          id?: string
          notes?: string | null
          resident_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          area_id?: string
          condo_id?: string
          created_at?: string
          ends_at?: string
          guests?: number | null
          id?: string
          notes?: string | null
          resident_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
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
            foreignKeyName: "reservations_condo_id_fkey"
            columns: ["condo_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
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
          status: Database["public"]["Enums"]["subscription_status"]
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
          status?: Database["public"]["Enums"]["subscription_status"]
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
          status?: Database["public"]["Enums"]["subscription_status"]
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
      support_sessions: {
        Row: {
          admin_user_id: string
          condo_id: string | null
          ended_at: string | null
          id: string
          reason: string | null
          started_at: string
          target_user_id: string
        }
        Insert: {
          admin_user_id: string
          condo_id?: string | null
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          target_user_id: string
        }
        Update: {
          admin_user_id?: string
          condo_id?: string | null
          ended_at?: string | null
          id?: string
          reason?: string | null
          started_at?: string
          target_user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          body: string | null
          condo_id: string
          created_at: string
          id: string
          opened_by: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          body?: string | null
          condo_id: string
          created_at?: string
          id?: string
          opened_by: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          body?: string | null
          condo_id?: string
          created_at?: string
          id?: string
          opened_by?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          condo_id: string
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          kind: Database["public"]["Enums"]["task_kind"]
          reservation_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          condo_id: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["task_kind"]
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          condo_id?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["task_kind"]
          reservation_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
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
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          accepted_at: string
          condo_id: string
          email: string
          expires_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          unit_label: string
        }[]
      }
      has_role: {
        Args: {
          _condo_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
      user_condo_id: { Args: { _user_id: string }; Returns: string }
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
        | "cancelled"
      task_kind: "pre_checklist" | "pos_checklist" | "manutencao" | "incidente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      ticket_priority: "low" | "normal" | "high" | "urgent"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
        "cancelled",
      ],
      task_kind: ["pre_checklist", "pos_checklist", "manutencao", "incidente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      ticket_priority: ["low", "normal", "high", "urgent"],
      ticket_status: ["open", "pending", "resolved", "closed"],
    },
  },
} as const
