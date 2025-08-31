import { View, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { usePressAnimation } from "@/hooks/onPressAnimation";
import { EditMealCard } from "@/components/home-screen/EditMealCard";
import { useMealPlan } from "@/context/meal-plan-provider";
import { useWeeks } from "@/context/week-data-provider";
import { useRecipes } from "@/context/recipe-data-provider";
import { MealPlanItem, RecipeWithTags } from "@/types/database";

export default function MealPlannerScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { weekId, displayRange } = params;

	const {
		currentMealPlan,
		loading: mealPlanLoading,
		error: mealPlanError,
		saveMealPlanForWeek,
		loadMealPlanForWeek,
		getAvailableRecipes,
		addMealToPlan,
		removeMealFromPlan,
		updateMealServings,
        regenerateMealPlan
	} = useMealPlan();

	const { getWeekById } = useWeeks();

	const loading = mealPlanLoading;
	const error = mealPlanError;

	const buttonPress = usePressAnimation({
		hapticStyle: "Medium",
		pressDistance: 4,
	});

	const selectedWeek = weekId ? getWeekById(weekId as string) : null;
	const availableRecipes = getAvailableRecipes();

	const [selectedMeals, setSelectedMeals] = useState<MealPlanItem[]>(currentMealPlan);
	const [hasChanges, setHasChanges] = useState(false);

	useEffect(() => {
		if (weekId) {
 			loadMealPlanForWeek(weekId as string).then(() => {
				if (__DEV__) {
					console.log("Meal plan ready for week:", weekId);
				}
			});
		}
	}, [weekId]);

    useEffect(() => {
		setSelectedMeals(currentMealPlan);
		// Reset hasChanges when we get a fresh meal plan
		setHasChanges(false);
	}, [currentMealPlan]);

	const handleBack = () => {
		if (hasChanges) {
			// TODO: Add confirmation dialog
			router.back();
		} else {
			router.back();
		}
	};

	const handleSaveChanges = async () => {
		if (!weekId) return;

		try {
			// Use the provider method to save
			await saveMealPlanForWeek(weekId as string, selectedMeals);
			console.log("Saved changes for week:", weekId);
            setHasChanges(false);
			router.back();
		} catch (error) {
			console.error("Error saving meal plan:", error);
			// Handle error - maybe show an alert
		}
	};

    const handleRegeneratePlan = async () => {
		if (!weekId) return;
		
		try {
			// This will regenerate and auto-save
			await regenerateMealPlan(weekId as string);
			setHasChanges(false); // Reset since we have a fresh saved plan
		} catch (error) {
			console.error("Error regenerating meal plan:", error);
		}
	};

	const handleSwapMeal = (mealId: string) => {
		// TODO: Implement meal swapping logic
		console.log("Swapping meal:", mealId);
		setHasChanges(true);
	};

	const handleRemoveMeal = (mealId: string) => {
		// Update local state
		setSelectedMeals((prev) => prev.filter((meal) => meal.id !== mealId));
		setHasChanges(true);

		// Optionally update the provider's current meal plan
		removeMealFromPlan(mealId);
	};

	const handleAddMeal = (recipe: RecipeWithTags) => {
		// Check if meal is already selected
		if (selectedMeals.some((meal) => meal.recipe.id === recipe.id)) {
			return;
		}

		// Create a meal plan item from the recipe
		const newMeal: MealPlanItem = {
			id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			recipe,
			servings: 1,
		};

		setSelectedMeals((prev) => [...prev, newMeal]);
		setHasChanges(true);
	};

	const handleServingsChange = (mealId: string, servings: number) => {
		setSelectedMeals((prev) =>
			prev.map((meal) => (meal.id === mealId ? { ...meal, servings } : meal)),
		);
		setHasChanges(true);
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 justify-center items-center">
					<Text className="text-lg font-montserrat-semibold text-gray-600">
						Loading meals...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView className="flex-1 bg-background">
				<View className="flex-1 justify-center items-center px-6">
					<View className="bg-[#FF6525] w-16 h-16 rounded-xl items-center justify-center mb-4">
						<Ionicons name="alert-circle" size={32} color="#FFF" />
					</View>
					<Text className="text-xl font-montserrat-bold text-[#FF6525] mb-2">
						Something went wrong
					</Text>
					<Text className="text-center text-gray-600 mb-4">
						{error.message}
					</Text>
					<Button
						onPress={handleBack}
						variant="outline"
						className="border-[#FF6525]"
						{...buttonPress}
					>
						<Text className="text-[#FF6525] font-montserrat-semibold">
							Go Back
						</Text>
					</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white">
			<View className="bg-white border-b border-gray-200">
				<View className="flex-row items-center justify-between px-4 py-3">
					<TouchableOpacity
						onPress={handleBack}
						className="p-2"
						{...buttonPress}
					>
						<Ionicons name="arrow-back" size={24} color="#374151" />
					</TouchableOpacity>

					<Text className="text-lg font-montserrat-bold text-gray-900">
						Swap Meals
					</Text>

					<TouchableOpacity
						onPress={handleSaveChanges}
						disabled={!hasChanges}
						className="p-2"
						{...buttonPress}
					>
						<Text
							className={`font-montserrat-semibold ${
								hasChanges ? "text-primary" : "text-gray-400"
							}`}
						>
							Save
						</Text>
					</TouchableOpacity>
				</View>

				<View className="px-4 pb-4">
					<View
						style={{
							backgroundColor: "#CCEA1F",
							borderColor: "#25551b",
							shadowColor: "#25551b",
						}}
						className="py-4 px-4 border-2 rounded-xl shadow-[0px_2px_0px_0px]"
					>
						<View className="flex-row items-center justify-between">
							<View>
								<Text
									className="text-xs font-montserrat-bold mb-1"
									style={{ color: "#25551b" }}
								>
									{selectedWeek?.displayTitle || "Selected Week"}
								</Text>
								<Text
									className="text-lg font-montserrat-semibold"
									style={{ color: "#25551b" }}
								>
									{selectedWeek?.display_range || displayRange}
								</Text>
							</View>
							<View className="bg-[#25551b]/10 px-3 py-1 rounded-lg">
								<Text className="text-[#25551b] font-montserrat-semibold">
									{selectedMeals.length} meals
								</Text>
							</View>
						</View>
					</View>
				</View>
			</View>

			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				<View className="px-4 pt-4">
					<Text className="text-lg font-montserrat-bold text-gray-900 mb-3">
						Your Selected Meals ({selectedMeals.length})
					</Text>

					{selectedMeals.length > 0 ? (
						<View className="flex flex-col gap-2">
							{selectedMeals.map((meal) => (
								<EditMealCard
									key={meal.id}
									meal={meal}
									showActions={true}
									onSwap={handleSwapMeal}
									onRemove={handleRemoveMeal}
								/>
							))}
						</View>
					) : (
						<View className="bg-gray-50 rounded-xl p-6 items-center">
							<Ionicons name="restaurant-outline" size={48} color="#9CA3AF" />
							<Text className="text-gray-600 font-montserrat-semibold mt-3">
								No meals selected for this week
							</Text>
							<Text className="text-gray-500 text-sm mt-1 text-center">
								Browse recipes below to add meals
							</Text>
						</View>
					)}
				</View>

				{/* Divider */}
				<View className="h-px bg-gray-200 mx-4 my-6" />

				{/* Available Recipes Section */}
				<View className="px-4 pb-6">
					<Text className="text-lg font-montserrat-bold text-gray-900 mb-3">
						Available Recipes ({availableRecipes.length})
					</Text>

					{availableRecipes.length > 0 ? (
						<View className="flex flex-col gap-2">
							{availableRecipes.map((recipe) => (
								<TouchableOpacity
									key={recipe.id}
									onPress={() => handleAddMeal(recipe)}
									{...buttonPress}
								>
									{/* Render recipe card here */}
									{/* Note: EditMealCard expects a meal, not a recipe */}
								</TouchableOpacity>
							))}
						</View>
					) : (
						<View className="bg-gray-50 rounded-xl p-6 items-center">
							<Ionicons name="checkmark-circle" size={48} color="#10B981" />
							<Text className="text-gray-600 font-montserrat-semibold mt-3">
								All recipes added!
							</Text>
							<Text className="text-gray-500 text-sm mt-1 text-center">
								You've selected all available recipes for this week
							</Text>
						</View>
					)}
				</View>
			</ScrollView>

			<View className="bg-white border-t border-gray-200 px-4 py-3">
				<View className="flex-row gap-3">
					<Button
						variant="outline"
						className="flex-1"
						onPress={handleBack}
						{...buttonPress}
					>
						<Text className="font-montserrat-semibold">Cancel</Text>
					</Button>
					<Button
						variant="default"
						className="flex-1"
						onPress={handleSaveChanges}
						{...buttonPress}
					>
						<Text className="font-montserrat-semibold">Save Changes</Text>
					</Button>
				</View>
			</View>
		</SafeAreaView>
	);
}
