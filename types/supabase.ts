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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      email_form_submissions: {
        Row: {
          age: number | null
          created_at: string | null
          email: string
          id: number
          location: string | null
          name: string
        }
        Insert: {
          age?: number | null
          created_at?: string | null
          email: string
          id?: number
          location?: string | null
          name: string
        }
        Update: {
          age?: number | null
          created_at?: string | null
          email?: string
          id?: number
          location?: string | null
          name?: string
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      ingredient_nutrition: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fats: number | null
          id: string
          ingredient_id: string
          per_unit_amount: number
          unit_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fats?: number | null
          id?: string
          ingredient_id?: string
          per_unit_amount: number
          unit_id?: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fats?: number | null
          id?: string
          ingredient_id?: string
          per_unit_amount?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_nutrition_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_nutrition_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          unit_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          unit_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          unit_id?: string | null
        }
        Relationships: []
      }
      instructions: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          instruction: string | null
          recipe_id: string
          step_number: number
          step_title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string | null
          recipe_id?: string
          step_number: number
          step_title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          instruction?: string | null
          recipe_id?: string
          step_number?: number
          step_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instructions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_log: {
        Row: {
          id: string
          last_week_date: string | null
          notes: string | null
          run_at: string | null
          weeks_created: number | null
        }
        Insert: {
          id?: string
          last_week_date?: string | null
          notes?: string | null
          run_at?: string | null
          weeks_created?: number | null
        }
        Update: {
          id?: string
          last_week_date?: string | null
          notes?: string | null
          run_at?: string | null
          weeks_created?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin: boolean | null
          city: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          onboarding_completed: boolean | null
          post_code: number | null
          updated_at: string | null
        }
        Insert: {
          admin?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          post_code?: number | null
          updated_at?: string | null
        }
        Update: {
          admin?: boolean | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          post_code?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recipe: {
        Row: {
          cook_time: number
          created_at: string
          default_servings: number
          description: string
          id: string
          image_url: string | null
          name: string
          prep_time: number
          total_time: number
        }
        Insert: {
          cook_time: number
          created_at?: string
          default_servings: number
          description: string
          id?: string
          image_url?: string | null
          name: string
          prep_time: number
          total_time: number
        }
        Update: {
          cook_time?: number
          created_at?: string
          default_servings?: number
          description?: string
          id?: string
          image_url?: string | null
          name?: string
          prep_time?: number
          total_time?: number
        }
        Relationships: []
      }
      recipe_equipment: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          recipe_id: string
        }
        Insert: {
          created_at?: string
          equipment_id?: string
          id?: string
          recipe_id?: string
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_equipment_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          created_at: string | null
          id: string
          ingredient_id: string
          quantity_per_serving: number | null
          recipe_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          quantity_per_serving?: number | null
          recipe_id?: string
          unit_id?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ingredient_id?: string
          quantity_per_serving?: number | null
          recipe_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_tags: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id?: string
          tag_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_tags_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          category: string
          created_at: string
          id: string
          name: string
          to_base: number | null
        }
        Insert: {
          abbreviation: string
          category: string
          created_at?: string
          id?: string
          name: string
          to_base?: number | null
        }
        Update: {
          abbreviation?: string
          category?: string
          created_at?: string
          id?: string
          name?: string
          to_base?: number | null
        }
        Relationships: []
      }
      user_meal_plans: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          servings: number
          sort_order: number | null
          updated_at: string | null
          user_id: string
          week_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          servings?: number
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
          week_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          servings?: number
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_meal_plans_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_meal_plans_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preference_tags: {
        Row: {
          tag_id: string
          user_preference_id: string
        }
        Insert: {
          tag_id: string
          user_preference_id: string
        }
        Update: {
          tag_id?: string
          user_preference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preference_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_preference_tags_user_preference_id_fkey"
            columns: ["user_preference_id"]
            isOneToOne: false
            referencedRelation: "user_preferences"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          meals_per_week: number | null
          serves_per_meal: number | null
          user_goals: string[] | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          meals_per_week?: number | null
          serves_per_meal?: number | null
          user_goals?: string[] | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          meals_per_week?: number | null
          serves_per_meal?: number | null
          user_goals?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_recipe_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: boolean
          recipe_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: boolean
          recipe_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: boolean
          recipe_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_recipes: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
        ]
      }
      weeks: {
        Row: {
          created_at: string | null
          display_range: string
          display_title: string | null
          end_date: string
          id: string
          is_current_week: boolean | null
          start_date: string
          updated_at: string | null
          week_number: number
          year: number
        }
        Insert: {
          created_at?: string | null
          display_range: string
          display_title?: string | null
          end_date: string
          id?: string
          is_current_week?: boolean | null
          start_date: string
          updated_at?: string | null
          week_number: number
          year: number
        }
        Update: {
          created_at?: string | null
          display_range?: string
          display_title?: string | null
          end_date?: string
          id?: string
          is_current_week?: boolean | null
          start_date?: string
          updated_at?: string | null
          week_number?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      recipe_rating_stats: {
        Row: {
          approval_percentage: number | null
          recipe_id: string | null
          thumbs_down_count: number | null
          thumbs_up_count: number | null
          total_ratings: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_recipe_ratings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_generate_future_weeks: {
        Args: { weeks_ahead?: number }
        Returns: {
          last_week_created: string
          weeks_created: number
        }[]
      }
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      get_week_meal_plan_with_recipes: {
        Args: { p_user_id?: string; p_week_id: string }
        Returns: {
          created_at: string
          id: string
          recipe_id: string
          recipe_image_url: string
          recipe_name: string
          recipe_total_time: number
          servings: number
          sort_order: number
          updated_at: string
          user_id: string
          week_id: string
        }[]
      }
      replace_week_meal_plan: {
        Args: { p_meals: Json; p_user_id?: string; p_week_id: string }
        Returns: {
          created_at: string | null
          id: string
          recipe_id: string
          servings: number
          sort_order: number | null
          updated_at: string | null
          user_id: string
          week_id: string
        }[]
      }
      update_current_week: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_goals: {
        Args: { p_goals: string[]; p_user_id: string }
        Returns: boolean
      }
      upsert_recipe_rating: {
        Args: { p_rating: boolean; p_recipe_id: string }
        Returns: {
          created_at: string | null
          id: string
          rating: boolean
          recipe_id: string
          updated_at: string | null
          user_id: string
        }
      }
      weekly_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_week_updated: boolean
          last_week_end: string
          maintenance_timestamp: string
          new_weeks_created: number
        }[]
      }
    }
    Enums: {
      tag_type:
        | "diet"
        | "budget"
        | "macro"
        | "allergen"
        | "method"
        | "skill_level"
        | "cuisine"
        | "time"
        | "meal_type"
        | "seasonal"
        | "occasion"
        | "equipment"
        | "goal"
        | "category"
        | "protein"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      tag_type: [
        "diet",
        "budget",
        "macro",
        "allergen",
        "method",
        "skill_level",
        "cuisine",
        "time",
        "meal_type",
        "seasonal",
        "occasion",
        "equipment",
        "goal",
        "category",
        "protein",
      ],
    },
  },
} as const
