import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import { supabase } from "@/config/supabase";
import { useAuth } from "./supabase-provider";
import { MealPlanItem, RecipeWithTags } from "@/types/database";
import { useReferenceData } from "./reference-data-provider";
import { useRecipes } from "./recipe-data-provider";
import { useUserPreferences } from "./user-preferences-provider";
import { useWeeks } from "./week-data-provider";
import { useRecipeRecommendations } from "@/hooks/use-recipe-recommendation";

interface MealPlanState {
	currentMealPlan: MealPlanItem[];
	loading: boolean;
	error: Error | null;
	initialized: boolean;
	dependenciesReady: boolean;

	// Meal plan generation
	generateMealPlan: () => Promise<void>;
	regenerateMealPlan: (weekId: string) => Promise<void>;

	// Meal plan management
	addMealToPlan: (recipe: RecipeWithTags, servings?: number) => void;
	removeMealFromPlan: (mealId: string) => void;
	updateMealServings: (mealId: string, servings: number) => void;

	// Meal plan queries
	isMealInPlan: (recipeId: string) => boolean;
	getTotalServings: () => number;
	getAvailableRecipes: () => RecipeWithTags[];

	// Meal plan persistence
	saveMealPlanForWeek: (
		weekId: string,
		meals?: MealPlanItem[],
	) => Promise<void>;
	loadMealPlanForWeek: (weekId: string) => Promise<void>;
	getMealPlanForWeek: (weekId: string) => Promise<MealPlanItem[]>;
}

const MealPlanContext = createContext<MealPlanState>({
	currentMealPlan: [],
	loading: false,
	error: null,
	initialized: false,
	dependenciesReady: false,
	generateMealPlan: async () => {},
	regenerateMealPlan: async () => {},
	addMealToPlan: () => {},
	removeMealFromPlan: () => {},
	updateMealServings: () => {},
	isMealInPlan: () => false,
	getTotalServings: () => 0,
	getAvailableRecipes: () => [],
	saveMealPlanForWeek: async () => {},
	loadMealPlanForWeek: async () => {},
	getMealPlanForWeek: async () => [],
});

export const useMealPlan = () => {
	const context = useContext(MealPlanContext);
	if (!context) {
		throw new Error("useMealPlan must be used within MealPlanProvider");
	}
	return context;
};

export function MealPlanProvider({ children }: PropsWithChildren) {
	const [currentMealPlan, setCurrentMealPlan] = useState<MealPlanItem[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [initialized, setInitialized] = useState(false);

	const { session } = useAuth();
	const { initialized: referenceDataInitialized } = useReferenceData();
	const { recipes, initialized: recipesInitialized } = useRecipes();
	const { preferences: userPreferences, initialized: preferencesInitialized } =
		useUserPreferences();
	const { initialized: weeksInitialized } = useWeeks();
	const { getRecommendations, getFilteredRecipes } = useRecipeRecommendations();

    const dependenciesReady = useMemo(() => {
		return (
			referenceDataInitialized &&
			recipesInitialized &&
			preferencesInitialized &&
			weeksInitialized
		);
	}, [
		referenceDataInitialized,
		recipesInitialized,
		preferencesInitialized,
		weeksInitialized,
	]);

	// Generate a unique ID for meal plan items
	const generateMealId = () =>
		`meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

	// Add a meal to the plan
	const addMealToPlan = useCallback(
		(recipe: RecipeWithTags, servings?: number) => {
			const existingMeal = currentMealPlan.find(
				(meal) => meal.recipe.id === recipe.id,
			);

			if (existingMeal) {
				if (__DEV__) {
					console.log("Recipe already in meal plan:", recipe.name);
				}
				return;
			}

			const newServings =
				servings ||
				userPreferences?.serves_per_meal ||
				recipe.default_servings ||
				1;

			const newMeal: MealPlanItem = {
				id: generateMealId(),
				recipe,
				servings: newServings,
			};

			if (__DEV__) {
				console.log("Adding meal to plan:", recipe.name);
			}

			setCurrentMealPlan((prev) => [...prev, newMeal]);
		},
		[currentMealPlan, userPreferences],
	);

	// Remove a meal from the plan
	const removeMealFromPlan = useCallback(
		(mealId: string) => {
			if (__DEV__) {
				const meal = currentMealPlan.find((m) => m.id === mealId);
				console.log("➖ Removing meal from plan:", meal?.recipe.name);
			}
			setCurrentMealPlan((prev) => prev.filter((meal) => meal.id !== mealId));
		},
		[currentMealPlan],
	);

	// Update meal servings
	const updateMealServings = useCallback((mealId: string, servings: number) => {
		if (__DEV__) {
			console.log("🍽️ Updating meal servings:", { mealId, servings });
		}
		setCurrentMealPlan((prev) =>
			prev.map((meal) => (meal.id === mealId ? { ...meal, servings } : meal)),
		);
	}, []);

	// Check if recipe is in meal plan
	const isMealInPlan = useCallback(
		(recipeId: string): boolean => {
			return currentMealPlan.some((meal) => meal.recipe.id === recipeId);
		},
		[currentMealPlan],
	);

	// Get total servings across all meals
	const getTotalServings = useCallback((): number => {
		return currentMealPlan.reduce((total, meal) => total + meal.servings, 0);
	}, [currentMealPlan]);

	// Get available recipes (filtered but excluding current plan)
	const getAvailableRecipes = useCallback((): RecipeWithTags[] => {
		if (!userPreferences) return recipes;

		const filtered = getFilteredRecipes(userPreferences);
		const currentMealPlanRecipeIds = currentMealPlan.map((m) => m.recipe.id);

		return filtered.filter(
			(recipe) => !currentMealPlanRecipeIds.includes(recipe.id),
		);
	}, [userPreferences, recipes, currentMealPlan, getFilteredRecipes]);

	const saveMealPlanForWeek = useCallback(
		async (weekId: string, meals?: MealPlanItem[]) => {
			const mealsToSave = meals || currentMealPlan;

			try {
				setLoading(true);
				setError(null);

				if (__DEV__) {
					console.log("💾 Saving meal plan for week:", {
						weekId,
						mealCount: mealsToSave.length,
					});
				}

				const mealsData = mealsToSave.map((meal, index) => ({
					recipe_id: meal.recipe.id,
					servings: meal.servings,
					sort_order: index,
				}));

				const { error: saveError } = await supabase.rpc(
					"replace_week_meal_plan",
					{
						p_week_id: weekId,
						p_meals: mealsData,
						p_user_id: session?.user?.id,
					},
				);

				if (saveError) {
					throw new Error(saveError.message);
				}

				if (__DEV__) {
					console.log("✅ Meal plan saved successfully");
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				console.error("Error saving meal plan:", error);
				setError(error);
				throw error;
			} finally {
				setLoading(false);
			}
		},
		[currentMealPlan, session?.user?.id],
	);

    const generateMealPlan = useCallback(
		async (weekId?: string) => {

            if (!dependenciesReady) {
				if (__DEV__) {
					console.log("⏳ Dependencies not ready, skipping meal plan generation", {
						referenceData: referenceDataInitialized,
						recipes: recipesInitialized,
						preferences: preferencesInitialized,
						weeks: weeksInitialized,
					});
				}
				return;
			}

			try {
				setLoading(true);
				setError(null);

				if (__DEV__) {
					console.log("🍽️ Generating initial meal plan...", {
						hasPreferences: !!userPreferences,
						mealsPerWeek: userPreferences?.meals_per_week,
					});
				}

				const mealsToSelect = userPreferences?.meals_per_week ?? 4;
				const currentMealPlanRecipeIds = currentMealPlan.map(
					(m) => m.recipe.id,
				);

				const recommendations = getRecommendations(userPreferences!, {
					count: mealsToSelect,
					excludeRecipeIds: currentMealPlanRecipeIds,
					currentMealPlanRecipeIds: currentMealPlanRecipeIds,
				});

				if (__DEV__) {
					console.log("✅ Recommendations generated:", {
						requested: mealsToSelect,
						received: recommendations.length,
					});
				}

				const mealPlanItems: MealPlanItem[] = recommendations.map((recipe) => ({
					id: generateMealId(),
					recipe,
					servings:
						userPreferences?.serves_per_meal || recipe.default_servings || 1,
				}));

				setCurrentMealPlan(mealPlanItems);
				setInitialized(true);

				// Auto-save the generated meal plan if weekId is provided
				if (weekId && session?.user?.id) {
					if (__DEV__) {
						console.log("💾 Auto-saving generated meal plan for week:", weekId);
					}

					try {
						await saveMealPlanForWeek(weekId, mealPlanItems);
						if (__DEV__) {
							console.log("✅ Generated meal plan saved successfully");
						}
					} catch (saveError) {
						// Log the error but don't throw - the meal plan is still usable locally
						console.error("Failed to save generated meal plan:", saveError);
					}
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				console.error("Error generating meal plan:", error);
				setError(error);
			} finally {
				setLoading(false);
			}
		},
		[
            dependenciesReady,
			currentMealPlan,
			getRecommendations,
			session?.user?.id,
		],
	);

	const getMealPlanForWeek = useCallback(
		async (weekId: string): Promise<MealPlanItem[]> => {
			try {
				if (!session?.user?.id) {
					return [];
				}

				const { data, error } = await supabase.rpc(
					"get_week_meal_plan_with_recipes",
					{
						p_week_id: weekId,
						p_user_id: session?.user?.id,
					},
				);

				if (error) {
					throw new Error(error.message);
				}

				if (!data || data.length === 0) {
					return [];
				}

				const mealPlanItems: MealPlanItem[] = data.map((item: any) => {
					const fullRecipe = recipes.find((r) => r.id === item.recipe_id);

					const recipe: RecipeWithTags = fullRecipe || {
						id: item.recipe_id,
						name: item.recipe_name,
						image_url: item.recipe_image_url,
						total_time: item.recipe_total_time,
						tagIds: [],
						description: "",
						prep_time: 0,
						cook_time: 0,
						default_servings: 1,
						created_at: "",
					};

					return {
						id: `saved_${item.id}`,
						recipe: recipe,
						servings: item.servings,
						week_id: item.week_id,
						user_id: item.user_id,
						created_at: item.created_at,
						updated_at: item.updated_at,
					};
				});

				return mealPlanItems;
			} catch (err) {
				console.error("Error fetching meal plan:", err);
				return [];
			}
		},
		[session?.user?.id, recipes],
	);

    const loadMealPlanForWeek = useCallback(
        async (weekId: string) => {
            if (!dependenciesReady) {
				if (__DEV__) {
					console.log("⏳ Dependencies not ready, skipping meal plan load");
				}
				return;
			}

            try {
                setLoading(true);
                setError(null);

                if (__DEV__) {
                    console.log("📖 Loading meal plan for week:", weekId, {
                        recipesAvailable: recipes.length,
                        preferencesReady: !!userPreferences
                    });
                }

                const savedMeals = await getMealPlanForWeek(weekId);

                if (savedMeals.length > 0) {
                    if (__DEV__) {
                        console.log("✅ Loaded existing meal plan");
                    }
                    setCurrentMealPlan(savedMeals);
                    setInitialized(true);
                } else {
                    if (__DEV__) {
                        console.log("🎲 No saved meal plan found");
                    }
                    
                    // Check if preferences are ready before generating
                    if (userPreferences && preferencesInitialized) {
                        if (__DEV__) {
                            console.log("🎲 Generating and saving new meal plan");
                        }
                        await generateMealPlan(weekId);
                    } else {
                        if (__DEV__) {
                            console.log("⏳ Preferences not ready, skipping generation");
                        }
                        // Set empty state but mark as initialized
                        setCurrentMealPlan([]);
                        setInitialized(true);
                    }
                }
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error("Error loading meal plan:", error);
                setError(error);

                // Only try to generate if preferences and recipes are ready
                if (userPreferences && preferencesInitialized && recipesInitialized) {
                    await generateMealPlan(weekId);
                } else {
                    setCurrentMealPlan([]);
                    setInitialized(true);
                }
            } finally {
                setLoading(false);
            }
        },
        [dependenciesReady],
    );

    // Regenerate meal plan (clear and generate new)
	const regenerateMealPlan = useCallback(
		async (weekId?: string) => {
			if (__DEV__) {
				console.log("🔄 Regenerating meal plan...");
			}
			setCurrentMealPlan([]);
			await generateMealPlan(weekId);
		},
		[generateMealPlan],
	);

	const contextValue = useMemo(
		() => ({
			currentMealPlan,
			loading,
			error,
			initialized,
            dependenciesReady,
			generateMealPlan,
			regenerateMealPlan,
			addMealToPlan,
			removeMealFromPlan,
			updateMealServings,
			isMealInPlan,
			getTotalServings,
			getAvailableRecipes,
			saveMealPlanForWeek,
			loadMealPlanForWeek,
			getMealPlanForWeek,
		}),
		[
			currentMealPlan,
			loading,
			error,
			initialized,
            dependenciesReady,
			generateMealPlan,
			regenerateMealPlan,
			addMealToPlan,
			removeMealFromPlan,
			updateMealServings,
			isMealInPlan,
			getTotalServings,
			getAvailableRecipes,
			saveMealPlanForWeek,
			loadMealPlanForWeek,
			getMealPlanForWeek,
		],
	);

	return (
		<MealPlanContext.Provider value={contextValue}>
			{children}
		</MealPlanContext.Provider>
	);
}
