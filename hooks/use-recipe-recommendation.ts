import { useMemo, useCallback } from "react";
import {
	RecipeRecommendationService,
	ScoredRecipe,
	RecommendationConfig,
} from "@/services/recipe-recommendation-service";
import { UserPreferencesWithTags, RecipeWithTags } from "@/types/database";
import { useRecipes } from "@/context/recipe-data-provider";
import { useReferenceData } from "@/context/reference-data-provider";

export function useRecipeRecommendations(
	config?: Partial<RecommendationConfig>,
) {
	const { recipes } = useRecipes();
	const { tags } = useReferenceData();

	// Create service instance with optional config
	const recommendationService = useMemo(
		() => new RecipeRecommendationService(config),
		[config],
	);

	// Get recommendations based on user preferences
	const getRecommendations = useCallback(
		(
			preferences: UserPreferencesWithTags,
			options: {
				count: number;
				excludeRecipeIds?: string[];
				recentRecipeIds?: string[];
				currentMealPlanRecipeIds?: string[];
			},
		): ScoredRecipe[] => {
			if (!recipes.length || !preferences) {
				return [];
			}

			// If no preferences, return random selection
			if (
				!preferences.user_preference_tags?.length &&
				!preferences.user_goals?.length
			) {
				const random = recommendationService.getRandomRecommendations(
					recipes,
					options.count,
					options.excludeRecipeIds,
				);
				// Convert to ScoredRecipe format with zero scores
				return random.map((r) => ({
					...r,
					score: 0,
					scoreBreakdown: {
						preferenceTagMatches: 0,
						goalAlignment: 0,
						diversityBonus: 0,
						recencyPenalty: 0,
						total: 0,
					},
					matchedTagIds: [],
					matchedGoals: [],
				}));
			}

			return recommendationService.getRecommendations(
				recipes,
				preferences,
				tags,
				options,
			);
		},
		[recipes, tags, recommendationService],
	);

	// Get filtered recipes based on preferences (without scoring)
	const getFilteredRecipes = useCallback(
		(preferences: UserPreferencesWithTags): RecipeWithTags[] => {
			if (!preferences.user_preference_tags?.length) {
				return recipes;
			}

			return recipes.filter((recipe) => {
				if (!recipe.tagIds?.length) return false;

				return recipe.tagIds.some((tagId) =>
					preferences.user_preference_tags?.find(
						(pref) => pref.tag_id === tagId,
					),
				);
			});
		},
		[recipes],
	);

	// Update recommendation config
	const updateConfig = useCallback(
		(newConfig: Partial<RecommendationConfig>) => {
			recommendationService.updateConfig(newConfig);
		},
		[recommendationService],
	);

	return {
		getRecommendations,
		getFilteredRecipes,
		updateConfig,
		currentConfig: recommendationService.getConfig(),
	};
}
