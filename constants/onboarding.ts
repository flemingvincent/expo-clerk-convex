export interface FormData {
    name: string;
    country: string;
    city: string;
    postcode: number;
    mealsPerWeek: number;
    servesPerMeal: number;
    userGoals: string[];
    userPreferenceTags: Array<{
        tag_id: string;
    }>;
}

export type UserGoal = "budget" | "macro" | "time" | "meal_type";

export interface GoalMetadata {
    type: UserGoal;
    name: string;
    description: string;
    icon: string; // Ionicons name
    color: string;
}

export const AVAILABLE_GOALS: GoalMetadata[] = [
    {
        type: "budget",
        name: "Saving Money",
        description: "Find budget-friendly recipes",
        icon: "cash-outline",
        color: "#10B981", // Green
    },
    {
        type: "macro",
        name: "Healthy Eating",
        description: "Focus on nutritional goals",
        icon: "fitness-outline",
        color: "#F59E0B", // Orange
    },
    {
        type: "time",
        name: "Saving Time",
        description: "Quick and easy meals",
        icon: "time-outline",
        color: "#3B82F6", // Blue
    },
    {
        type: "meal_type",
        name: "Weekly Planning",
        description: "Organized meal preparation",
        icon: "calendar-outline",
        color: "#8B5CF6", // Purple
    },
];