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

    const convertToBaseUnit = useCallback(
		(quantity: number, fromUnitId: string | null, baseUnitId: string | null): number => {
			// If no units specified, return as-is
			if (!fromUnitId || !baseUnitId) return quantity;

			// If already in base unit, return as-is
			if (fromUnitId === baseUnitId) return quantity;

			const fromUnit = getUnitById(fromUnitId);
			
			// If no conversion factor or it's null, return as-is
			if (!fromUnit || fromUnit.to_base === null) {
				console.warn(`No conversion factor for unit: ${fromUnitId}`);
				return quantity;
			}

			// Convert to base unit using the to_base multiplier
			return quantity * fromUnit.to_base;
		},
		[getUnitById]
	);

	const ingredients = useMemo(() => {
		const ingredientMap = new Map<string, CartIngredient>();

		if (initialized) {
			console.log("Processing meal plan for cart", currentMealPlan);

			currentMealPlan.forEach((meal) => {
				const recipeIngredients = getRecipeIngredients(meal.recipe.id);

				recipeIngredients.forEach((recipeIng) => {
					const ingredient = getIngredientById(recipeIng.ingredient_id);
					
					if (!ingredient) {
						console.warn(`Ingredient not found: ${recipeIng.ingredient_id}`);
						return;
					}

					// Get the base unit for this ingredient (from ingredients table)
					const baseUnitId = ingredient.unit_id;
					const baseUnit = baseUnitId ? getUnitById(baseUnitId) : null;

					// Calculate quantity in recipe unit
					const quantityInRecipeUnit = recipeIng.quantity_per_serving
						? recipeIng.quantity_per_serving * meal.servings
						: 0;

					// Convert to base unit
					const quantityInBaseUnit = convertToBaseUnit(
						quantityInRecipeUnit,
						recipeIng.unit_id,
						baseUnitId
					);

					// Create key using ingredient_id and BASE unit (not recipe unit)
					// This ensures all quantities for the same ingredient are grouped together
					const key = `${recipeIng.ingredient_id}_${baseUnitId || "no_unit"}`;

					if (ingredientMap.has(key)) {
						const existing = ingredientMap.get(key)!;
						existing.total_quantity += quantityInBaseUnit;
						existing.recipes.push({
							recipe_id: meal.recipe.id,
							recipe_name: meal.recipe.name,
							quantity: quantityInBaseUnit,
							servings: meal.servings,
						});
					} else {
						ingredientMap.set(key, {
							ingredient_id: recipeIng.ingredient_id,
							ingredient_name: ingredient.name,
							category_id: ingredient.category_id,
							total_quantity: quantityInBaseUnit,
							unit_id: baseUnitId, // Use base unit, not recipe unit
							unit_name: baseUnit?.name || null,
							unit_abbreviation: baseUnit?.abbreviation || null,
							recipes: [
								{
									recipe_id: meal.recipe.id,
									recipe_name: meal.recipe.name,
									quantity: quantityInBaseUnit,
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
		convertToBaseUnit,
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
