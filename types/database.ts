// @/types/database.ts
import { Database } from './supabase';

// ============================================
// Table Row Types (for querying/reading data)
// ============================================
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Recipe = Database['public']['Tables']['recipe']['Row'];
export type UserMealPlan = Database['public']['Tables']['user_meal_plans']['Row'];
export type Week = Database['public']['Tables']['weeks']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type Ingredient = Database['public']['Tables']['ingredients']['Row'];
export type Equipment = Database['public']['Tables']['equipment']['Row'];
export type Unit = Database['public']['Tables']['units']['Row'];
export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
export type UserPreferenceTag = Database['public']['Tables']['user_preference_tags']['Row'];
export type RecipeTag = Database['public']['Tables']['recipe_tags']['Row'];
export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row'];
export type RecipeEquipment = Database['public']['Tables']['recipe_equipment']['Row'];
export type Instruction = Database['public']['Tables']['instructions']['Row'];

// ============================================
// Insert Types (for creating new records)
// ============================================
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type RecipeInsert = Database['public']['Tables']['recipe']['Insert'];
export type UserMealPlanInsert = Database['public']['Tables']['user_meal_plans']['Insert'];
export type WeekInsert = Database['public']['Tables']['weeks']['Insert'];
export type TagInsert = Database['public']['Tables']['tags']['Insert'];
export type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
export type UserPreferenceTagInsert = Database['public']['Tables']['user_preference_tags']['Insert'];

// ============================================
// Update Types (for updating existing records)
// ============================================
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type RecipeUpdate = Database['public']['Tables']['recipe']['Update'];
export type UserMealPlanUpdate = Database['public']['Tables']['user_meal_plans']['Update'];
export type WeekUpdate = Database['public']['Tables']['weeks']['Update'];
export type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

// ============================================
// Function Return Types
// ============================================
export type MealPlanWithRecipe = Database['public']['Functions']['get_week_meal_plan_with_recipes']['Returns'][0];
export type ReplaceMealPlanResult = Database['public']['Functions']['replace_week_meal_plan']['Returns'][0];
export type WeeklyMaintenanceResult = Database['public']['Functions']['weekly_maintenance']['Returns'][0];
export type AutoGenerateWeeksResult = Database['public']['Functions']['auto_generate_future_weeks']['Returns'][0];

// ============================================
// Enum Types
// ============================================
export type TagType = Database['public']['Enums']['tag_type'];

// ============================================
// Composite/Extended Types for App Use
// ============================================

// Recipe with its tags array (as used in your app)
export interface RecipeWithTags extends Recipe {
    tagIds: string[];
    score?: number;
    matchingTags?: string[];
}

// Week with computed properties
export interface WeekWithComputed extends Week {
    displayTitle: string;
    weekOffset: number;
    status: 'past' | 'current' | 'future';
}

// Meal plan item as used in the app
export interface MealPlanItem {
    id: string;
    recipe: RecipeWithTags;
    servings: number;
    status?: 'draft' | 'confirmed' | 'completed';
    week_id?: string;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}

// User preferences with tags
export interface UserPreferencesWithTags extends UserPreferences {
    user_preference_tags?: Array<{
        tag_id: string;
    }>;
}

// ============================================
// Utility Types
// ============================================

// Helper to extract table names
export type TableName = keyof Database['public']['Tables'];

// Helper to get any table's row type
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

// Helper to get any table's insert type
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];

// Helper to get any table's update type
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];

// Status types for meal plans
export type MealPlanStatus = 'draft' | 'confirmed' | 'completed';

// ============================================
// Type Guards
// ============================================

export function isProfile(obj: any): obj is Profile {
    return obj && typeof obj.id === 'string' && 'display_name' in obj;
}

export function isRecipe(obj: any): obj is Recipe {
    return obj && typeof obj.id === 'string' && 'name' in obj && 'prep_time' in obj;
}

export function isUserMealPlan(obj: any): obj is UserMealPlan {
    return obj && typeof obj.recipe_id === 'string' && typeof obj.week_id === 'string';
}