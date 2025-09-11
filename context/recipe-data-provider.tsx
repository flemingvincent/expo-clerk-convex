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
import { useReferenceData } from "./reference-data-provider";
import { RecipeWithTags } from "@/types/database";

interface RecipeState {
	recipes: RecipeWithTags[];
	loading: boolean;
	error: Error | null;
	initialized: boolean;

	// Core methods
	refreshRecipes: () => Promise<void>;

	// Basic filtering methods
	filterByTagIds: (tagIds: string[]) => RecipeWithTags[];
	filterBySearch: (query: string) => RecipeWithTags[];

	// Helper methods
	getRecipeById: (id: string) => RecipeWithTags | undefined;
	getRecipesByIds: (ids: string[]) => RecipeWithTags[];
	getRecipesExcluding: (excludeIds: string[]) => RecipeWithTags[];
}

const RecipeContext = createContext<RecipeState>({
	recipes: [],
	loading: false,
	error: null,
	initialized: false,
	refreshRecipes: async () => {},
	filterByTagIds: () => [],
	filterBySearch: () => [],
	getRecipeById: () => undefined,
	getRecipesByIds: () => [],
	getRecipesExcluding: () => [],
});

export const useRecipes = () => {
	const context = useContext(RecipeContext);
	if (!context) {
		throw new Error("useRecipes must be used within RecipeProvider");
	}
	return context;
};

export function RecipeProvider({ children }: PropsWithChildren) {
	const [recipes, setRecipes] = useState<RecipeWithTags[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [initialized, setInitialized] = useState(false);

	const fetchRecipes = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			if (__DEV__) {
				console.log("🔍 Fetching recipes...");
			}

			const { data: recipesData, error: fetchError } = await supabase
				.from("recipe")
				.select(
					`
          *,
          recipe_tags(
            tag_id
          )
        `,
				)
				.order("created_at", { ascending: false });

			if (fetchError) {
				throw new Error(fetchError.message);
			}

			// Transform the data to extract just the tag_ids
			const recipesWithTags: RecipeWithTags[] =
				recipesData?.map((recipe) => {
					const tagIds =
						recipe.recipe_tags?.map((rt: any) => rt.tag_id).filter(Boolean) ||
						[];

					return {
						...recipe,
						tagIds: tagIds,
					};
				}) || [];

			if (__DEV__) {
				console.log("📊 Recipes fetched:", {
					total: recipesWithTags.length,
					withTags: recipesWithTags.filter((r) => r.tagIds.length > 0).length,
				});
			}

			setRecipes(recipesWithTags);
			setInitialized(true);
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			console.error("Error fetching recipes:", error);
			setError(error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Simple tag-based filtering
	const filterByTagIds = useCallback(
		(tagIds: string[]): RecipeWithTags[] => {
			if (!tagIds.length) return recipes;

			return recipes.filter((recipe) =>
				recipe.tagIds?.some((tagId) => tagIds.includes(tagId)),
			);
		},
		[recipes],
	);

	// Simple text search
	const filterBySearch = useCallback(
		(query: string): RecipeWithTags[] => {
			if (!query.trim()) return recipes;

			const lowerQuery = query.toLowerCase();
			return recipes.filter(
				(recipe) =>
					recipe.name.toLowerCase().includes(lowerQuery) ||
					recipe.description?.toLowerCase().includes(lowerQuery),
			);
		},
		[recipes],
	);

	// Get single recipe by ID
	const getRecipeById = useCallback(
		(id: string): RecipeWithTags | undefined => {
			return recipes.find((recipe) => recipe.id === id);
		},
		[recipes],
	);

	// Get multiple recipes by IDs
	const getRecipesByIds = useCallback(
		(ids: string[]): RecipeWithTags[] => {
			return recipes.filter((recipe) => ids.includes(recipe.id));
		},
		[recipes],
	);

	// Get all recipes excluding specific IDs
	const getRecipesExcluding = useCallback(
		(excludeIds: string[]): RecipeWithTags[] => {
			return recipes.filter((recipe) => !excludeIds.includes(recipe.id));
		},
		[recipes],
	);

	useEffect(() => {
        if (!initialized) {
            fetchRecipes();
        }
    }, [initialized]);

	const contextValue = useMemo(
		() => ({
			recipes,
			loading,
			error,
			initialized,
			refreshRecipes: fetchRecipes,
			filterByTagIds,
			filterBySearch,
			getRecipeById,
			getRecipesByIds,
			getRecipesExcluding,
		}),
		[
			recipes,
			loading,
			error,
			initialized,
			fetchRecipes,
			filterByTagIds,
			filterBySearch,
			getRecipeById,
			getRecipesByIds,
			getRecipesExcluding,
		],
	);

	return (
		<RecipeContext.Provider value={contextValue}>
			{children}
		</RecipeContext.Provider>
	);
}
