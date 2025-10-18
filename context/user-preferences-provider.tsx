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
import { UserPreferences, UserPreferencesWithTags } from "@/types/database";

interface RecipeRating {
	recipe_id: string;
	rating: boolean; // true = thumbs up, false = thumbs down
}

interface UserPreferencesState {
	preferences: UserPreferencesWithTags | null;
	loading: boolean;
	error: Error | null;
	initialized: boolean;

	refreshPreferences: () => Promise<void>;
	updatePreferences: (
		updates: Partial<UserPreferencesWithTags>,
	) => Promise<void>;

	hasPreferences: boolean;
	hasGoals: boolean;
	hasPreferenceTags: boolean;
	getPreferenceTagIds: () => string[];

	savedRecipeIds: string[];
	isSaved: (recipeId: string) => boolean;
	toggleSaveRecipe: (recipeId: string) => Promise<void>;
	refreshSavedRecipes: () => Promise<void>;

	recipeRatings: RecipeRating[];
	getRating: (recipeId: string) => boolean | null;
	setRating: (recipeId: string, rating: boolean) => Promise<void>;
	removeRating: (recipeId: string) => Promise<void>;
	refreshRatings: () => Promise<void>;
}

const UserPreferencesContext = createContext<UserPreferencesState>({
	preferences: null,
	loading: false,
	error: null,
	initialized: false,
	refreshPreferences: async () => {},
	updatePreferences: async () => {},
	hasPreferences: false,
	hasGoals: false,
	hasPreferenceTags: false,
	getPreferenceTagIds: () => [],
	savedRecipeIds: [],
	isSaved: () => false,
	toggleSaveRecipe: async () => {},
	refreshSavedRecipes: async () => {},
	recipeRatings: [],
	getRating: () => null,
	setRating: async () => {},
	removeRating: async () => {},
	refreshRatings: async () => {},
});

export const useUserPreferences = () => {
	const context = useContext(UserPreferencesContext);
	if (!context) {
		throw new Error(
			"useUserPreferences must be used within UserPreferencesProvider",
		);
	}
	return context;
};

export function UserPreferencesProvider({ children }: PropsWithChildren) {
	const [preferences, setPreferences] =
		useState<UserPreferencesWithTags | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [initialized, setInitialized] = useState(false);
	const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
	const [recipeRatings, setRecipeRatings] = useState<RecipeRating[]>([]);

	const { session } = useAuth();
	const userId = session?.user?.id;

	const fetchPreferences = useCallback(async () => {
		if (!userId) {
			if (__DEV__) {
				console.log("No user ID, skipping preferences fetch");
			}
			setPreferences(null);
			setSavedRecipeIds([]);
			setRecipeRatings([]);
			setInitialized(true);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			if (__DEV__) {
				console.log("👤 Fetching user preferences...");
			}

			// Fetch user preferences, saved recipes, and ratings in parallel
			const [prefResult, savedResult, ratingsResult] = await Promise.all([
				supabase
					.from("user_preferences")
					.select("*")
					.eq("user_id", userId)
					.single(),
				supabase
					.from("user_saved_recipes")
					.select("recipe_id")
					.eq("user_id", userId),
				supabase
					.from("user_recipe_ratings")
					.select("recipe_id, rating")
					.eq("user_id", userId),
			]);

			if (savedResult.error) {
				console.error("Error fetching saved recipes:", savedResult.error);
			} else {
				setSavedRecipeIds(savedResult.data?.map((item) => item.recipe_id) || []);
			}

			if (ratingsResult.error) {
				console.error("Error fetching recipe ratings:", ratingsResult.error);
			} else {
				setRecipeRatings(ratingsResult.data || []);
				if (__DEV__) {
					console.log(`⭐ Loaded ${ratingsResult.data?.length || 0} recipe ratings`);
				}
			}

			const { data: prefData, error: prefError } = prefResult;

			if (prefError) {
				if (prefError.code === "PGRST116") {
					if (__DEV__) {
						console.log("No preferences found, creating defaults");
					}

					const { data: newPref, error: createError } = await supabase
						.from("user_preferences")
						.insert({
							user_id: userId,
							meals_per_week: 4,
							serves_per_meal: 2,
							user_goals: [],
						})
						.select()
						.single();

					if (createError) {
						throw new Error(createError.message);
					}

					const defaultPrefs: UserPreferencesWithTags = {
						...newPref,
						user_preference_tags: [],
					};

					setPreferences(defaultPrefs);
					setInitialized(true);
					return;
				}
				throw new Error(prefError.message);
			}

			if (prefData) {
				const { data: tagData, error: tagError } = await supabase
					.from("user_preference_tags")
					.select("tag_id")
					.eq("user_preference_id", prefData.id);

				if (tagError) {
					console.error("Error fetching preference tags:", tagError);
				}

				const completePreferences: UserPreferencesWithTags = {
					...prefData,
					user_preference_tags:
						tagData?.map((tag) => ({ tag_id: tag.tag_id })) || [],
				};

				if (__DEV__) {
					console.log("User preferences loaded:", {
						mealsPerWeek: completePreferences.meals_per_week,
						servesPerMeal: completePreferences.serves_per_meal,
						goals: completePreferences.user_goals,
						preferenceTagCount:
							completePreferences.user_preference_tags?.length,
					});
				}

				setPreferences(completePreferences);
				setInitialized(true);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			console.error("Error fetching user preferences:", error);
			setError(error);
			setInitialized(true);
		} finally {
			setLoading(false);
		}
	}, [userId]);

	const fetchSavedRecipes = useCallback(async () => {
		if (!userId) {
			setSavedRecipeIds([]);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("user_saved_recipes")
				.select("recipe_id")
				.eq("user_id", userId);

			if (error) throw error;

			setSavedRecipeIds(data?.map((item) => item.recipe_id) || []);

			if (__DEV__) {
				console.log(`📌 Loaded ${data?.length || 0} saved recipes`);
			}
		} catch (err) {
			console.error("Error fetching saved recipes:", err);
		}
	}, [userId]);

	const fetchRatings = useCallback(async () => {
		if (!userId) {
			setRecipeRatings([]);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("user_recipe_ratings")
				.select("recipe_id, rating")
				.eq("user_id", userId);

			if (error) throw error;

			setRecipeRatings(data || []);

			if (__DEV__) {
				console.log(`⭐ Loaded ${data?.length || 0} recipe ratings`);
			}
		} catch (err) {
			console.error("Error fetching recipe ratings:", err);
		}
	}, [userId]);

	const isSaved = useCallback(
		(recipeId: string) => {
			return savedRecipeIds.includes(recipeId);
		},
		[savedRecipeIds]
	);

	const getRating = useCallback(
		(recipeId: string): boolean | null => {
			const rating = recipeRatings.find((r) => r.recipe_id === recipeId);
			return rating ? rating.rating : null;
		},
		[recipeRatings]
	);

	const setRating = useCallback(
		async (recipeId: string, rating: boolean) => {
			if (!userId) {
				console.error("Cannot rate recipe: no user ID");
				return;
			}

			try {
				// Use the upsert_recipe_rating function
				const { data, error } = await supabase.rpc("upsert_recipe_rating", {
					p_recipe_id: recipeId,
					p_rating: rating,
				});

				if (error) throw error;

				// Update local state
				setRecipeRatings((prev) => {
					const existing = prev.findIndex((r) => r.recipe_id === recipeId);
					if (existing >= 0) {
						const updated = [...prev];
						updated[existing] = { recipe_id: recipeId, rating };
						return updated;
					}
					return [...prev, { recipe_id: recipeId, rating }];
				});

				if (__DEV__) {
					console.log(`${rating ? "👍" : "👎"} Rated recipe:`, recipeId);
				}
			} catch (err) {
				console.error("Error setting recipe rating:", err);
				throw err;
			}
		},
		[userId]
	);

	const removeRating = useCallback(
		async (recipeId: string) => {
			if (!userId) {
				console.error("Cannot remove rating: no user ID");
				return;
			}

			try {
				const { error } = await supabase
					.from("user_recipe_ratings")
					.delete()
					.eq("user_id", userId)
					.eq("recipe_id", recipeId);

				if (error) throw error;

				// Update local state
				setRecipeRatings((prev) =>
					prev.filter((r) => r.recipe_id !== recipeId)
				);

				if (__DEV__) {
					console.log("🗑️ Removed rating for recipe:", recipeId);
				}
			} catch (err) {
				console.error("Error removing recipe rating:", err);
				throw err;
			}
		},
		[userId]
	);

	const toggleSaveRecipe = useCallback(
		async (recipeId: string) => {
			if (!userId) {
				console.error("Cannot save recipe: no user ID");
				return;
			}

			try {
				const isCurrentlySaved = isSaved(recipeId);

				if (isCurrentlySaved) {
					// Unsave
					const { error } = await supabase
						.from("user_saved_recipes")
						.delete()
						.eq("user_id", userId)
						.eq("recipe_id", recipeId);

					if (error) throw error;

					setSavedRecipeIds((prev) => prev.filter((id) => id !== recipeId));

					if (__DEV__) {
						console.log("❌ Unsaved recipe:", recipeId);
					}
				} else {
					// Save
					const { error } = await supabase
						.from("user_saved_recipes")
						.insert({
							user_id: userId,
							recipe_id: recipeId,
						});

					if (error) throw error;

					setSavedRecipeIds((prev) => [...prev, recipeId]);

					if (__DEV__) {
						console.log("✅ Saved recipe:", recipeId);
					}
				}
			} catch (err) {
				console.error("Error toggling saved recipe:", err);
				throw err;
			}
		},
		[userId, isSaved]
	);

	const updatePreferences = useCallback(
		async (updates: Partial<UserPreferencesWithTags>) => {
			if (!preferences?.id || !userId) {
				console.error("Cannot update preferences: no preference ID or user ID");
				return;
			}

			try {
				setLoading(true);
				setError(null);

				const { user_preference_tags, ...mainUpdates } = updates;

				if (Object.keys(mainUpdates).length > 0) {
					const { error: updateError } = await supabase
						.from("user_preferences")
						.update(mainUpdates)
						.eq("id", preferences.id);

					if (updateError) throw updateError;
				}

				let updatedTags = preferences.user_preference_tags;
				if (user_preference_tags !== undefined) {
					const { error: deleteError } = await supabase
						.from("user_preference_tags")
						.delete()
						.eq("user_preference_id", preferences.id);

					if (deleteError) throw deleteError;

					if (user_preference_tags.length > 0) {
						const tagInserts = user_preference_tags.map((tag, index) => ({
							user_preference_id: preferences.id,
							tag_id: tag.tag_id,
						}));

						const { error: insertError } = await supabase
							.from("user_preference_tags")
							.insert(tagInserts);

						if (insertError) throw insertError;
					}

					updatedTags = user_preference_tags;
				}

				setPreferences((prev) =>
					prev
						? {
								...prev,
								...mainUpdates,
								user_preference_tags: updatedTags,
							}
						: null,
				);

				if (__DEV__) {
					console.log("✅ Updated preferences:", updates);
				}
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				console.error("Error updating preferences:", error);
				setError(error);
				throw error;
			} finally {
				setLoading(false);
			}
		},
		[preferences?.id, userId],
	);

	const hasPreferences = useMemo(() => {
		return preferences !== null && preferences.id !== "";
	}, [preferences]);

	const hasGoals = useMemo(() => {
		return (preferences?.user_goals?.length ?? 0) > 0;
	}, [preferences]);

	const hasPreferenceTags = useMemo(() => {
		return (preferences?.user_preference_tags?.length ?? 0) > 0;
	}, [preferences]);

	const getPreferenceTagIds = useCallback(() => {
		return preferences?.user_preference_tags?.map((t) => t.tag_id) || [];
	}, [preferences]);

	// Initialize preferences when user logs in
	useEffect(() => {
		if (userId && !initialized) {
			fetchPreferences();
		} else if (!userId && (preferences || !initialized)) {
			setPreferences(null);
			setSavedRecipeIds([]);
			setRecipeRatings([]);
			setInitialized(false);
			setError(null);
		}
	}, [userId, initialized, fetchPreferences, preferences]);

	const contextValue = useMemo(
		() => ({
			preferences,
			loading,
			error,
			initialized,
			refreshPreferences: fetchPreferences,
			updatePreferences,
			hasPreferences,
			hasGoals,
			hasPreferenceTags,
			getPreferenceTagIds,
			savedRecipeIds,
			isSaved,
			toggleSaveRecipe,
			refreshSavedRecipes: fetchSavedRecipes,
			recipeRatings,
			getRating,
			setRating,
			removeRating,
			refreshRatings: fetchRatings,
		}),
		[
			preferences,
			loading,
			error,
			initialized,
			fetchPreferences,
			updatePreferences,
			hasPreferences,
			hasGoals,
			hasPreferenceTags,
			getPreferenceTagIds,
			savedRecipeIds,
			isSaved,
			toggleSaveRecipe,
			fetchSavedRecipes,
			recipeRatings,
			getRating,
			setRating,
			removeRating,
			fetchRatings,
		]
	);

	return (
		<UserPreferencesContext.Provider value={contextValue}>
			{children}
		</UserPreferencesContext.Provider>
	);
}