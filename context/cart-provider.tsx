import {
	createContext,
	PropsWithChildren,
	useContext,
	useMemo,
	useCallback,
} from "react";
import { useMealPlan } from "./meal-plan-provider";
import { useRecipes } from "./recipe-data-provider";
import { useReferenceData } from "./reference-data-provider";

interface CartIngredient {
	ingredient_id: string;
	ingredient_name: string;
	total_quantity: number;
	unit_id: string | null;
	unit_name: string | null;
	unit_abbreviation: string | null;
	category_id?: string | null;
	recipes: {
		recipe_id: string;
		recipe_name: string;
		quantity: number;
		servings: number;
	}[];
}

interface CartState {
	ingredients: CartIngredient[];
	totalIngredients: number;
	loading: boolean;
	initialized: boolean;

	// Helper methods
	refreshCart: () => void;
}

const CartContext = createContext<CartState>({
	ingredients: [],
	totalIngredients: 0,
	loading: false,
	initialized: false,
	refreshCart: () => {},
});

export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) {
		throw new Error("useCart must be used within CartProvider");
	}
	return context;
};

export function CartProvider({ children }: PropsWithChildren) {
	const { currentMealPlan, initialized: mealPlanInitialized } = useMealPlan();
	const { getRecipeIngredients, initialized: recipesInitialized } =
		useRecipes();
	const {
		getIngredientById,
		getUnitById,
		initialized: referenceInitialized,
	} = useReferenceData();

	const initialized = useMemo(() => {
		return mealPlanInitialized && recipesInitialized && referenceInitialized;
	}, [mealPlanInitialized, recipesInitialized, referenceInitialized]);

	const ingredients = useMemo(() => {
		const ingredientMap = new Map<string, CartIngredient>();

		// Only process if initialized, but don't return early
		if (initialized) {
			console.log("hi", currentMealPlan);

			// Process each meal in the plan
			currentMealPlan.forEach((meal) => {
				const recipeIngredients = getRecipeIngredients(meal.recipe.id);

				recipeIngredients.forEach((recipeIng) => {
					// Get ingredient and unit details from reference data
					const ingredient = getIngredientById(recipeIng.ingredient_id);
					const unit = recipeIng.unit_id
						? getUnitById(recipeIng.unit_id)
						: null;

					if (!ingredient) {
						console.warn(`Ingredient not found: ${recipeIng.ingredient_id}`);
						return;
					}

					// Calculate the quantity needed based on servings
					const quantityNeeded = recipeIng.quantity_per_serving
						? recipeIng.quantity_per_serving * meal.servings
						: 0;

					// Create a unique key for ingredient + unit combination
					const key = `${recipeIng.ingredient_id}_${recipeIng.unit_id || "no_unit"}`;

					if (ingredientMap.has(key)) {
						const existing = ingredientMap.get(key)!;
						existing.total_quantity += quantityNeeded;
						existing.recipes.push({
							recipe_id: meal.recipe.id,
							recipe_name: meal.recipe.name,
							quantity: quantityNeeded,
							servings: meal.servings,
						});
					} else {
						ingredientMap.set(key, {
							ingredient_id: recipeIng.ingredient_id,
							ingredient_name: ingredient.name,
							category_id: ingredient.category_id,
							total_quantity: quantityNeeded,
							unit_id: recipeIng.unit_id,
							unit_name: unit?.name || null,
							unit_abbreviation: unit?.abbreviation || null,
							recipes: [
								{
									recipe_id: meal.recipe.id,
									recipe_name: meal.recipe.name,
									quantity: quantityNeeded,
									servings: meal.servings,
								},
							],
						});
					}
				});
			});
		}

		return Array.from(ingredientMap.values()).sort((a, b) =>
			a.ingredient_name.localeCompare(b.ingredient_name),
		);
	}, [
		currentMealPlan,
		getRecipeIngredients,
		getIngredientById,
		getUnitById,
		initialized,
	]);

	const totalIngredients = useMemo(() => ingredients.length, [ingredients]);

	const refreshCart = useCallback(() => {
		// Force re-calculation if needed
		// Currently happens automatically through useMemo dependencies
	}, []);

	const contextValue = useMemo(
		() => ({
			ingredients,
			totalIngredients,
			loading: false,
			initialized,
			refreshCart,
		}),
		[ingredients, totalIngredients, initialized, refreshCart],
	);

	return (
		<CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
	);
}
