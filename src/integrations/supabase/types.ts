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
          created_at: string
          description: string | null
          icon: string | null
          id: string
          min_advance_hours: number
          name: string
          requires_checklist: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          capacity?: number | null
          condo_id: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          min_advance_hours?: number
          name: string
          requires_checklist?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          capacity?: number | null
          condo_id?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          min_advance_hours?: number
          name?: string
          requires_checklist?: boolean
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
          created_at: string
          created_by: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
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
      user_condo_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "sindico" | "administradora" | "morador" | "funcionario"
      reservation_status:
        | "pendente"
        | "confirmada"
        | "em_execucao"
        | "concluida"
        | "cancelada"
      task_kind: "pre_checklist" | "pos_checklist" | "manutencao" | "incidente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
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
      reservation_status: [
        "pendente",
        "confirmada",
        "em_execucao",
        "concluida",
        "cancelada",
      ],
      task_kind: ["pre_checklist", "pos_checklist", "manutencao", "incidente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
    },
  },
} as const
