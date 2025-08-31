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

	const { session } = useAuth();
	const userId = session?.user?.id;

	const fetchPreferences = useCallback(async () => {
		if (!userId) {
			if (__DEV__) {
				console.log("No user ID, skipping preferences fetch");
			}
			setPreferences(null);
			setInitialized(true);
			return;
		}

		try {
			setLoading(true);
			setError(null);

			if (__DEV__) {
				console.log("👤 Fetching user preferences...");
			}

			// Fetch user preferences
			const { data: prefData, error: prefError } = await supabase
				.from("user_preferences")
				.select("*")
				.eq("user_id", userId)
				.single();

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
				throw error; // Re-throw to let caller handle
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
		],
	);

	return (
		<UserPreferencesContext.Provider value={contextValue}>
			{children}
		</UserPreferencesContext.Provider>
	);
}
