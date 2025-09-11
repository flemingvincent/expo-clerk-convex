import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { supabase } from "@/config/supabase";
import { Tag, Ingredient, Equipment, Unit } from "@/types/database";

interface ReferenceDataState {
	tags: Tag[];
	ingredients: Ingredient[];
	equipment: Equipment[];
	units: Unit[];
	loading: {
		tags: boolean;
		ingredients: boolean;
		equipment: boolean;
		units: boolean;
	};
	error: {
		tags: Error | null;
		ingredients: Error | null;
		equipment: Error | null;
		units: Error | null;
	};
	initialized: boolean;

	// Refresh methods
	refreshTags: () => Promise<void>;
	refreshIngredients: () => Promise<void>;
	refreshEquipment: () => Promise<void>;
	refreshUnits: () => Promise<void>;
	refreshAll: () => Promise<void>;

	// Helper methods
	getTagById: (id: string) => Tag | undefined;
	getTagsByType: (type: string) => Tag[];
	getIngredientById: (id: string) => Ingredient | undefined;
	getEquipmentById: (id: string) => Equipment | undefined;
	getUnitById: (id: string) => Unit | undefined;
}

const ReferenceDataContext = createContext<ReferenceDataState>({
	tags: [],
	ingredients: [],
	equipment: [],
	units: [],
	loading: {
		tags: false,
		ingredients: false,
		equipment: false,
		units: false,
	},
	error: {
		tags: null,
		ingredients: null,
		equipment: null,
		units: null,
	},
	initialized: false,
	refreshTags: async () => {},
	refreshIngredients: async () => {},
	refreshEquipment: async () => {},
	refreshUnits: async () => {},
	refreshAll: async () => {},
	getTagById: () => undefined,
	getTagsByType: () => [],
	getIngredientById: () => undefined,
	getEquipmentById: () => undefined,
	getUnitById: () => undefined,
});

export const useReferenceData = () => {
	const context = useContext(ReferenceDataContext);
	if (!context) {
		throw new Error(
			"useReferenceData must be used within ReferenceDataProvider",
		);
	}
	return context;
};

export function ReferenceDataProvider({ children }: PropsWithChildren) {
	const [tags, setTags] = useState<Tag[]>([]);
	const [ingredients, setIngredients] = useState<Ingredient[]>([]);
	const [equipment, setEquipment] = useState<Equipment[]>([]);
	const [units, setUnits] = useState<Unit[]>([]);
	const [initialized, setInitialized] = useState(false);

	const [loading, setLoading] = useState({
		tags: false,
		ingredients: false,
		equipment: false,
		units: false,
	});

	const [error, setError] = useState<{
		tags: Error | null;
		ingredients: Error | null;
		equipment: Error | null;
		units: Error | null;
	}>({
		tags: null,
		ingredients: null,
		equipment: null,
		units: null,
	});

	const fetchTags = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, tags: true }));
			setError((prev) => ({ ...prev, tags: null }));

			const { data, error: fetchError } = await supabase
				.from("tags")
				.select("*")
				.order("name");

			if (fetchError) {
				throw new Error(fetchError.message);
			}

			setTags(data || []);

			if (__DEV__) {
				console.log("✅ Tags loaded:", data?.length || 0);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError((prev) => ({ ...prev, tags: error }));
			console.error("Error fetching tags:", error);
		} finally {
			setLoading((prev) => ({ ...prev, tags: false }));
		}
	}, []);

	const fetchIngredients = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, ingredients: true }));
			setError((prev) => ({ ...prev, ingredients: null }));

			const { data, error: fetchError } = await supabase
				.from("ingredients")
				.select("*")
				.order("name");

			if (fetchError) {
				throw new Error(fetchError.message);
			}

			setIngredients(data || []);

			if (__DEV__) {
				console.log("✅ Ingredients loaded:", data?.length || 0);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError((prev) => ({ ...prev, ingredients: error }));
			console.error("Error fetching ingredients:", error);
		} finally {
			setLoading((prev) => ({ ...prev, ingredients: false }));
		}
	}, []);

	const fetchEquipment = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, equipment: true }));
			setError((prev) => ({ ...prev, equipment: null }));

			const { data, error: fetchError } = await supabase
				.from("equipment")
				.select("*")
				.order("name");

			if (fetchError) {
				throw new Error(fetchError.message);
			}

			setEquipment(data || []);

			if (__DEV__) {
				console.log("✅ Equipment loaded:", data?.length || 0);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError((prev) => ({ ...prev, equipment: error }));
			console.error("Error fetching equipment:", error);
		} finally {
			setLoading((prev) => ({ ...prev, equipment: false }));
		}
	}, []);

	const fetchUnits = useCallback(async () => {
		try {
			setLoading((prev) => ({ ...prev, units: true }));
			setError((prev) => ({ ...prev, units: null }));

			const { data, error: fetchError } = await supabase
				.from("units")
				.select("*")
				.order("name");

			if (fetchError) {
				throw new Error(fetchError.message);
			}

			setUnits(data || []);

			if (__DEV__) {
				console.log("✅ Units loaded:", data?.length || 0);
			}
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			setError((prev) => ({ ...prev, units: error }));
			console.error("Error fetching units:", error);
		} finally {
			setLoading((prev) => ({ ...prev, units: false }));
		}
	}, []);

	const refreshAll = useCallback(async () => {
		if (__DEV__) {
			console.log("🔄 Refreshing all reference data...");
		}

		// Fetch all in parallel since they don't depend on each other
		await Promise.all([
			fetchTags(),
			fetchIngredients(),
			fetchEquipment(),
			fetchUnits(),
		]);

		setInitialized(true);

		if (__DEV__) {
			console.log("✅ All reference data loaded");
		}
	}, [fetchTags, fetchIngredients, fetchEquipment, fetchUnits]);

	// Helper methods
	const getTagById = useCallback(
		(id: string) => {
			return tags.find((tag) => tag.id === id);
		},
		[tags],
	);

	const getTagsByType = useCallback(
		(type: string) => {
			return tags.filter((tag) => tag.type === type);
		},
		[tags],
	);

	const getIngredientById = useCallback(
		(id: string) => {
			return ingredients.find((ingredient) => ingredient.id === id);
		},
		[ingredients],
	);

	const getEquipmentById = useCallback(
		(id: string) => {
			return equipment.find((item) => item.id === id);
		},
		[equipment],
	);

	const getUnitById = useCallback(
		(id: string) => {
			return units.find((unit) => unit.id === id);
		},
		[units],
	);

	// Initialize on mount
	useEffect(() => {
		refreshAll();
	}, []);

	return (
		<ReferenceDataContext.Provider
			value={{
				tags,
				ingredients,
				equipment,
				units,
				loading,
				error,
				initialized,
				refreshTags: fetchTags,
				refreshIngredients: fetchIngredients,
				refreshEquipment: fetchEquipment,
				refreshUnits: fetchUnits,
				refreshAll,
				getTagById,
				getTagsByType,
				getIngredientById,
				getEquipmentById,
				getUnitById,
			}}
		>
			{children}
		</ReferenceDataContext.Provider>
	);
}
