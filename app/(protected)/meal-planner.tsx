import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { useMealPlan } from "@/context/meal-plan-provider";
import { useWeeks } from "@/context/week-data-provider";
import { MealPlanItem, RecipeWithTags } from "@/types/database";
import { MealCard } from "@/components/home-screen/MealCard";
import * as Haptics from "expo-haptics";

export default function MealPlannerScreen() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const { weekId } = params;

	const {
		currentMealPlan,
		loading: mealPlanLoading,
		error: mealPlanError,
		saveMealPlanForWeek,
		loadMealPlanForWeek,
		getAvailableRecipes,
	} = useMealPlan();


	const { getWeekById } = useWeeks();

	const loading = mealPlanLoading;
	const error = mealPlanError;
	const selectedWeek = weekId ? getWeekById(weekId as string) : null;
	const availableRecipes = getAvailableRecipes();

	const [originalMealPlan, setOriginalMealPlan] = useState<MealPlanItem[]>([]);
	const [selectedMeals, setSelectedMeals] = useState<MealPlanItem[]>([]);
	const [hasChanges, setHasChanges] = useState(false);
	const [isCollapsed, setIsCollapsed] = useState(false);

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
		const clonedMealPlan = currentMealPlan.map(meal => ({
			...meal,
			recipe: { ...meal.recipe }
		}));
		
		setOriginalMealPlan(clonedMealPlan);
		setSelectedMeals(clonedMealPlan);
		setHasChanges(false);
	}, [currentMealPlan]);

    const handleBack = () => {
		if (hasChanges) {
			setSelectedMeals([...originalMealPlan]);
			setHasChanges(false);
		}
		router.back();
	};

    const handleCancel = () => {
		setSelectedMeals([...originalMealPlan]);
		setHasChanges(false);
		router.back();
	};

    const handleSaveChanges = async () => {
		if (!weekId) return;

		try {
			await saveMealPlanForWeek(weekId as string, selectedMeals);
			console.log("Saved changes for week:", weekId);
			setHasChanges(false);
			setOriginalMealPlan([...selectedMeals]);
			router.back();
		} catch (error) {
			console.error("Error saving meal plan:", error);
		}
	};

    const handleRemoveMeal = (mealId: string) => {
		setSelectedMeals((prev) => prev.filter((meal) => meal.id !== mealId));
		setHasChanges(true);
	};

    const handleAddMeal = (recipe: RecipeWithTags) => {
		if (selectedMeals.some((meal) => meal.recipe.id === recipe.id)) {
			return;
		}

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
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
						variant="outline"
						className="border-[#FF6525]"
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
			<View className="bg-white border-b-2 border-b-[#EBEBEB]">
				<View className="flex-row items-center justify-between px-4 py-3">
					<Pressable
						onPress={handleBack}
                        onPressIn={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}}
						className="p-2"
					>
						<Ionicons name="arrow-back" size={24} color="#1f2937" />
					</Pressable>

					<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
						Edit: {selectedWeek?.displayTitle || "Week"}
					</Text>

					<Pressable
						onPress={handleSaveChanges}
                        onPressIn={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}}
						disabled={!hasChanges}
						className="p-2"
					>
						<Text className="font-montserrat-semibold uppercase text-gray-800">
							Save
						</Text>
					</Pressable>
				</View>

				<View className="flex-row justify-center items-center px-12 pb-3">
					<View className="flex-1 flex-row justify-between items-center">
						<View className="items-center">
							<View
								style={{
									width: 32,
									height: 32,
									borderRadius: 8,
									borderWidth: 2,
									borderColor: "#25551b",
									backgroundColor: "#CCEA1F",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name="calendar-outline" size={16} color="#25551b" />
							</View>
							<Text
								className="text-xs mt-1 font-montserrat-bold uppercase"
								style={{ color: "#25551b" }}
							>
								Plan
							</Text>
						</View>

						<View
							style={{
								height: 3,
								backgroundColor: "#EBEBEB",
								flex: 1,
								marginHorizontal: 8,
								marginTop: -12,
								borderRadius: 2,
							}}
						/>

						<View className="items-center">
							<View
								style={{
									width: 28,
									height: 28,
									borderRadius: 7,
									borderWidth: 2,
									borderColor: "#EBEBEB",
									backgroundColor: "#FFFFFF",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name="cart-outline" size={14} color="#9CA3AF" />
							</View>
							<Text
								className="text-xs mt-1 font-montserrat-semibold uppercase"
								style={{ color: "#9CA3AF" }}
							>
								Shop
							</Text>
						</View>

						<View
							style={{
								height: 3,
								backgroundColor: "#EBEBEB",
								flex: 1,
								marginHorizontal: 8,
								marginTop: -12,
								borderRadius: 2,
							}}
						/>

						<View className="items-center">
							<View
								style={{
									width: 28,
									height: 28,
									borderRadius: 7,
									borderWidth: 2,
									borderColor: "#EBEBEB",
									backgroundColor: "#FFFFFF",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<Ionicons name="star-outline" size={14} color="#9CA3AF" />
							</View>
							<Text
								className="text-xs mt-1 font-montserrat-semibold uppercase"
								style={{ color: "#9CA3AF" }}
							>
								Review
							</Text>
						</View>
					</View>
				</View>
			</View>

			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				<View className="px-4 pt-4">
					<View className="flex-row items-center justify-between mb-3">
						<Text className="text-lg font-montserrat-bold text-gray-900">
							Your Selected Meals ({selectedMeals.length})
						</Text>

						<Pressable
							onPress={() => setIsCollapsed(!isCollapsed)}
                            onPressIn={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}}
							className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100"
						>
							<Ionicons
								name={isCollapsed ? "albums-outline" : "list-outline"}
								size={18}
								color="#6B7280"
							/>
							<Text className="text-sm font-montserrat-semibold text-gray-600">
								{isCollapsed ? "Card View" : "List View"}
							</Text>
						</Pressable>
					</View>

					{selectedMeals.length > 0 ? (
						<View className="flex flex-col gap-2">
							{selectedMeals.map((meal) => (
								<MealCard
									key={meal.id}
									recipe={meal}
									editable={true}
									isInPlan={true}
                                    isCollapsed={isCollapsed}
									onRemove={handleRemoveMeal}
									onServingsChange={handleServingsChange}
									onPress={() => router.push(`/recipe/${meal.recipe.id}`)}
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

				<View className="h-px bg-gray-200 mx-4 my-6" />

				<View className="px-4 pb-6">
					<Text className="text-lg font-montserrat-bold text-gray-900 mb-3">
						Explore Recipes
					</Text>

					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{availableRecipes.filter((recipe) => !selectedMeals.some((meal) => meal.recipe.id === recipe.id)).map((recipe) => {
							const tempMeal: MealPlanItem = {
								id: recipe.id,
								recipe: recipe,
								servings: 1,
							};

							return (
								<MealCard
									key={recipe.id}
									recipe={tempMeal}
									editable={true}
									isInPlan={false}
									onAdd={() => handleAddMeal(recipe)}
									width={350}
									onPress={() => router.push(`/recipe/${recipe.id}`)}
								/>
							);
						})}
					</ScrollView>
				</View>
			</ScrollView>

			<View className="bg-white border-t border-gray-200 px-4 py-3">
				<View className="flex-row gap-3">
					<Button
						variant="outline"
						className="flex-1"
						onPress={handleCancel}
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
					>
						<Text className="font-montserrat-semibold">Cancel</Text>
					</Button>
					<Button
						variant="default"
						className="flex-1"
						onPress={handleSaveChanges}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
                        disabled={!hasChanges}
					>
						<Text className="font-montserrat-semibold">Save Changes</Text>
					</Button>
				</View>
			</View>
		</SafeAreaView>
	);
}
