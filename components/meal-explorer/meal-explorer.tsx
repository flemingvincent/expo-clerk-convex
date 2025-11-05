import { View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { MealCard } from "@/components/home-screen/MealCard";
import { MealPlanItem, RecipeWithTags } from "@/types/database";
import * as Haptics from "expo-haptics";

interface MealExplorerProps {
	availableRecipes: RecipeWithTags[];
	selectedMeals: MealPlanItem[];
	onAddMeal: (recipe: RecipeWithTags) => void;
}

// Define tag groups with their corresponding tag IDs from the database
const RECIPE_GROUPS = [
	{
		id: "budget",
		title: "Budget",
		icon: "cash-outline", // Placeholder - replace with your custom icon
		tagIds: ["266febdc-1143-421b-884c-6b94d0e641d5"], // Replace with actual tag ID
	},
	{
		id: "highProtein",
		title: "High Protein",
		icon: "fitness-outline", // Placeholder - replace with your custom icon
		tagIds: ["652f7535-dddd-4566-a929-10be60102208"], // Replace with actual tag ID
	},
	{
		id: "lowFat",
		title: "Low Fat",
		icon: "heart-outline", // Placeholder - replace with your custom icon
		tagIds: ["16423fe9-50c2-4495-848b-569eeedf7437"], // Replace with actual tag ID
	},
	{
		id: "quickEasy",
		title: "Quick & Easy",
		icon: "time-outline", // Placeholder - replace with your custom icon
		tagIds: ["f7a40eb5-9c4a-423c-8c22-9427a3f338a4"], // Replace with actual tag ID
	},
];

export function MealExplorer({ 
	availableRecipes, 
	selectedMeals,
	onAddMeal 
}: MealExplorerProps) {
	const router = useRouter();
	const [selectedGroup, setSelectedGroup] = useState(RECIPE_GROUPS[0].id);
	const recipeScrollViewRef = useRef<ScrollView>(null);

	const filteredRecipes = availableRecipes.filter(
		(recipe) => !selectedMeals.some((meal) => meal.recipe.id === recipe.id)
	);

	// Filter recipes by tag group
	const getRecipesByTags = (tagIds: string[]) => {
		return filteredRecipes.filter((recipe) =>
			recipe.tagIds?.some((tag) => tagIds.includes(tag))
		);
	};

	const activeGroup = RECIPE_GROUPS.find(g => g.id === selectedGroup);
	const groupRecipes = activeGroup ? getRecipesByTags(activeGroup.tagIds) : [];

	// Reset scroll position when group changes
	useEffect(() => {
		recipeScrollViewRef.current?.scrollTo({ x: 0, animated: true });
	}, [selectedGroup]);

	const handleGroupSelect = (groupId: string) => {
        setSelectedGroup(groupId);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        // Immediately scroll to start
        recipeScrollViewRef.current?.scrollTo({ x: 0, animated: false });
    };

	return (
		<View className="pb-6">
			<Text className="text-xl font-montserrat-bold text-gray-900 mb-4 px-4">
				Explore Recipes
			</Text>

			{/* Category Slider */}
			<ScrollView 
				horizontal 
				showsHorizontalScrollIndicator={false}
				className="mb-6"
			>
				<View className="pl-4" />
				{RECIPE_GROUPS.map((group) => {
					const isSelected = selectedGroup === group.id;
					return (
						<Pressable
							key={group.id}
							onPress={() => handleGroupSelect(group.id)}
							className={`mr-3 px-4 py-3 rounded-xl flex-row items-center gap-2 ${
								isSelected 
									? "bg-[#CCEA1F] border-2 border-[#25551b]" 
									: "bg-gray-100 border-2 border-transparent"
							}`}
						>
							<Ionicons 
								name={group.icon as any} 
								size={20} 
								color={isSelected ? "#25551b" : "#6B7280"} 
							/>
							<Text 
								className={`font-montserrat-semibold ${
									isSelected ? "text-[#25551b]" : "text-gray-600"
								}`}
							>
								{group.title}
							</Text>
						</Pressable>
					);
				})}
				<View className="pr-4" />
			</ScrollView>

			{/* Recipe Slider */}
			{groupRecipes.length > 0 ? (
				<ScrollView
                    key={`scroll-${selectedGroup}`}
					ref={recipeScrollViewRef}
					horizontal 
					showsHorizontalScrollIndicator={false}
				>
					<View className="pl-4" />
					{groupRecipes.map((recipe) => {
						const tempMeal: MealPlanItem = {
							id: recipe.id,
							recipe: recipe,
							servings: 1,
						};

						return (
							<View key={recipe.id} className="pr-3">
								<MealCard
									recipe={tempMeal}
									editable={true}
									isInPlan={false}
									onAdd={() => onAddMeal(recipe)}
									width={350}
									onPress={() => router.push(`/recipe/${recipe.id}`)}
								/>
							</View>
						);
					})}
					<View className="pr-4" />
				</ScrollView>
			) : (
				<View className="mx-4 bg-gray-50 rounded-xl p-6 items-center">
					<Ionicons name="search-outline" size={48} color="#9CA3AF" />
					<Text className="text-gray-600 font-montserrat-semibold mt-3">
						No recipes found
					</Text>
					<Text className="text-gray-500 text-sm mt-1 text-center">
						Try selecting a different category
					</Text>
				</View>
			)}
		</View>
	);
}