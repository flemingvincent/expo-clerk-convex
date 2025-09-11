import { RecipeWithTags, UserPreferencesWithTags, Tag } from "@/types/database";

export interface ScoredRecipe extends RecipeWithTags {
	score: number;
	scoreBreakdown: {
		preferenceTagMatches: number;
		goalAlignment: number;
		diversityBonus: number;
		recencyPenalty: number;
		total: number;
	};
	matchedTagIds: string[];
	matchedGoals: string[];
}

export interface RecommendationConfig {
	// Scoring weights (can be adjusted easily)
	weights: {
		preferenceTag: number;
		goalAlignment: number;
		diversity: number;
		recency: number;
	};

	// Algorithm parameters
	diversityTagTypes?: string[]; // Which tag types to consider for diversity
	recencyWindowDays?: number; // How many days back to check for recent meals
	minimumScore?: number; // Minimum score threshold
}

const DEFAULT_CONFIG: RecommendationConfig = {
	weights: {
		preferenceTag: 1.0,
		goalAlignment: 2.0,
		diversity: 0.5,
		recency: -0.5,
	},
	diversityTagTypes: ["cuisine", "protein"],
	recencyWindowDays: 7,
	minimumScore: 0,
};

export class RecipeRecommendationService {
	private config: RecommendationConfig;

	constructor(config: Partial<RecommendationConfig> = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Main recommendation method
	 */
	getRecommendations(
		recipes: RecipeWithTags[],
		preferences: UserPreferencesWithTags,
		tags: Tag[],
		options: {
			count: number;
			excludeRecipeIds?: string[];
			recentRecipeIds?: string[];
			currentMealPlanRecipeIds?: string[];
		},
	): ScoredRecipe[] {
		// Filter out excluded recipes first
		let availableRecipes = recipes;
		if (options.excludeRecipeIds?.length) {
			availableRecipes = recipes.filter(
				(r) => !options.excludeRecipeIds!.includes(r.id),
			);
		}

		// Score all available recipes
		const scoredRecipes = availableRecipes.map((recipe) =>
			this.scoreRecipe(recipe, preferences, tags, {
				recentRecipeIds: options.recentRecipeIds || [],
				currentMealPlanRecipeIds: options.currentMealPlanRecipeIds || [],
			}),
		);

		// Filter by minimum score if configured
		const validRecipes = scoredRecipes.filter(
			(r) => r.score >= this.config.minimumScore!,
		);

		// Sort by score (highest first)
		const sorted = validRecipes.sort((a, b) => {
			if (Math.abs(a.score - b.score) < 0.01) {
				// Add randomization for very similar scores
				return Math.random() - 0.5;
			}
			return b.score - a.score;
		});

		return sorted.slice(0, options.count);
	}

	/**
	 * Score a single recipe
	 */
	private scoreRecipe(
		recipe: RecipeWithTags,
		preferences: UserPreferencesWithTags,
		tags: Tag[],
		context: {
			recentRecipeIds: string[];
			currentMealPlanRecipeIds: string[];
		},
	): ScoredRecipe {
		const scoreBreakdown = {
			preferenceTagMatches: 0,
			goalAlignment: 0,
			diversityBonus: 0,
			recencyPenalty: 0,
			total: 0,
		};

		const matchedTagIds: string[] = [];
		const matchedGoals: string[] = [];

		// 1. Score preference tag matches
		if (recipe.tagIds && preferences.user_preference_tags?.length) {
			recipe.tagIds.forEach((tagId) => {
				if (
					preferences.user_preference_tags?.find(
						(pref) => pref.tag_id === tagId,
					)
				) {
					scoreBreakdown.preferenceTagMatches +=
						this.config.weights.preferenceTag;
					matchedTagIds.push(tagId);
				}
			});
		}

		// 2. Score goal alignment
		if (recipe.tagIds && preferences.user_goals?.length && tags.length) {
			const recipeTags = tags.filter((tag) => recipe.tagIds?.includes(tag.id));

			preferences.user_goals.forEach((goalType, index) => {
				const priority = preferences.user_goals!.length - index;
				const goalTags = recipeTags.filter((tag) => tag.type === goalType);

				if (goalTags.length > 0) {
					scoreBreakdown.goalAlignment +=
						priority * this.config.weights.goalAlignment;
					matchedGoals.push(goalType);
				}
			});
		}

		// 3. Calculate diversity bonus
		if (context.currentMealPlanRecipeIds.length > 0) {
			scoreBreakdown.diversityBonus = this.calculateDiversityBonus(
				recipe,
				context.currentMealPlanRecipeIds,
				tags,
			);
		}

		// 4. Apply recency penalty
		if (context.recentRecipeIds.includes(recipe.id)) {
			scoreBreakdown.recencyPenalty = this.config.weights.recency;
		}

		// Calculate total score
		scoreBreakdown.total =
			scoreBreakdown.preferenceTagMatches +
			scoreBreakdown.goalAlignment +
			scoreBreakdown.diversityBonus +
			scoreBreakdown.recencyPenalty;

		return {
			...recipe,
			score: scoreBreakdown.total,
			scoreBreakdown,
			matchedTagIds,
			matchedGoals,
		};
	}

	/**
	 * Calculate diversity bonus based on how different this recipe is from current plan
	 */
	private calculateDiversityBonus(
		recipe: RecipeWithTags,
		currentMealPlanRecipeIds: string[],
		tags: Tag[],
	): number {
		// This is a placeholder - you can make this as sophisticated as needed
		// For now, just give a small bonus if the recipe has different tags
		if (!recipe.tagIds?.length || !this.config.diversityTagTypes?.length) {
			return 0;
		}

		// In a real implementation, you'd compare against the tags of recipes
		// already in the meal plan
		return this.config.weights.diversity;
	}

	/**
	 * Get random recommendations (fallback when no preferences)
	 */
	getRandomRecommendations(
		recipes: RecipeWithTags[],
		count: number,
		excludeRecipeIds: string[] = [],
	): RecipeWithTags[] {
		const available = recipes.filter((r) => !excludeRecipeIds.includes(r.id));
		const shuffled = [...available].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, count);
	}

	/**
	 * Update configuration (for A/B testing or user preferences)
	 */
	updateConfig(newConfig: Partial<RecommendationConfig>) {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): RecommendationConfig {
		return { ...this.config };
	}
}
