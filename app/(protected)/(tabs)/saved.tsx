import { View, ScrollView, Pressable, RefreshControl } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { MealCard } from "@/components/home-screen/MealCard";
import { useUserPreferences } from "@/context/user-preferences-provider";
import { useReferenceData } from "@/context/reference-data-provider";
import { supabase } from "@/config/supabase";
import { RecipeWithTags, MealPlanItem } from "@/types/database";
import * as Haptics from "expo-haptics";

export default function Saved() {
	const router = useRouter();
	const { savedRecipeIds, toggleSaveRecipe, refreshSavedRecipes } = useUserPreferences();
	
	const [savedRecipes, setSavedRecipes] = useState<RecipeWithTags[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isCollapsed, setIsCollapsed] = useState(true);

	useEffect(() => {
		fetchSavedRecipes();
	}, [savedRecipeIds]);

	const fetchSavedRecipes = async () => {
		if (savedRecipeIds.length === 0) {
			setSavedRecipes([]);
			setLoading(false);
			return;
		}

		try {
			setError(null);
			
			const { data, error: fetchError } = await supabase
				.from("recipe")
				.select(`
					*,
					recipe_tags(tag_id)
				`)
				.in("id", savedRecipeIds);

			if (fetchError) throw fetchError;

			const recipesWithTags: RecipeWithTags[] = data?.map(recipe => ({
				...recipe,
				tagIds: recipe.recipe_tags?.map((rt: any) => rt.tag_id).filter(Boolean) || [],
			})) || [];

			setSavedRecipes(recipesWithTags);
		} catch (err) {
			console.error("Error fetching saved recipes:", err);
			setError(err instanceof Error ? err.message : "Failed to load saved recipes");
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = async () => {
		setRefreshing(true);
		await refreshSavedRecipes();
		await fetchSavedRecipes();
		setRefreshing(false);
	};

	const handleRecipePress = (recipeId: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.push(`/recipe/${recipeId}`);
	};

	const handleRemoveSaved = async (recipeId: string) => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			await toggleSaveRecipe(recipeId);
		} catch (error) {
			console.error("Error removing saved recipe:", error);
		}
	};

	// Convert recipes to MealPlanItem format for MealCard
	const savedMeals: MealPlanItem[] = useMemo(() => {
		return savedRecipes.map(recipe => ({
			id: recipe.id,
			recipe: recipe,
			servings: recipe.default_servings,
		}));
	}, [savedRecipes]);

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-white">
				<View className="bg-white border-b-2 border-b-[#EBEBEB]">
					<View className="px-4 py-3">
						<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide text-center">
							Saved Recipes
						</Text>
					</View>
				</View>

				<View className="flex-1 items-center justify-center">
					<View
						style={{
							backgroundColor: "#CCEA1F",
							borderWidth: 2,
							borderColor: "#25551b",
						}}
						className="w-20 h-20 rounded-xl items-center justify-center mb-6"
					>
						<Ionicons name="heart" size={40} color="#25551b" />
					</View>
					<Text
						style={{ color: "#25551b" }}
						className="text-xl font-montserrat-bold tracking-wide uppercase"
					>
						LOADING FAVORITES
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView className="flex-1 bg-white">
				<View className="bg-white border-b-2 border-b-[#EBEBEB]">
					<View className="px-4 py-3">
						<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide text-center">
							Saved Recipes
						</Text>
					</View>
				</View>

				<View className="flex-1 items-center justify-center p-6">
					<View
						style={{
							backgroundColor: "#fef2f2",
							borderWidth: 2,
							borderColor: "#dc2626",
						}}
						className="w-20 h-20 rounded-xl items-center justify-center mb-6"
					>
						<Ionicons name="alert-circle" size={40} color="#dc2626" />
					</View>
					<Text
						style={{ color: "#25551b" }}
						className="text-xl font-montserrat-bold tracking-wide uppercase mb-4 text-center"
					>
						Something went wrong
					</Text>
					<Text className="text-base font-montserrat-medium text-gray-600 text-center mb-6">
						{error}
					</Text>
					<Button
						onPress={handleRefresh}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
						variant="outline"
					>
						<Text className="font-montserrat-bold tracking-wide uppercase">
							Try Again
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
					<View className="w-10" />
					
					<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
						Saved Recipes
					</Text>

					{savedRecipes.length > 0 && (
						<Pressable
							onPress={() => {
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
								setIsCollapsed(!isCollapsed);
							}}
							className="w-10 items-center justify-center"
						>
							<Ionicons
								name={isCollapsed ? "albums-outline" : "list-outline"}
								size={24}
								color="#1f2937"
							/>
						</Pressable>
					)}
					
					{savedRecipes.length === 0 && <View className="w-10" />}
				</View>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor="#25551b"
					/>
				}
			>
				{savedRecipes.length > 0 ? (
					<View className="px-4 pt-4 pb-6">
						<View className="flex-row items-center justify-between mb-4">
							<Text className="text-lg font-montserrat-bold text-gray-900">
								{savedRecipes.length} {savedRecipes.length === 1 ? 'Recipe' : 'Recipes'}
							</Text>
						</View>

						<View className="gap-2">
							{savedMeals.map((meal) => (
								<MealCard
									key={meal.id}
									recipe={meal}
									isCollapsed={isCollapsed}
									editable={true}
									isInPlan={false}
									onPress={() => handleRecipePress(meal.recipe.id)}
									onRemove={() => handleRemoveSaved(meal.recipe.id)}
								/>
							))}
						</View>
					</View>
				) : (
					<View className="flex-1 items-center justify-center p-6" style={{ minHeight: 500 }}>
						<View
							style={{
								backgroundColor: "#FFFFFF",
								borderWidth: 2,
								borderColor: "#EBEBEB",
								borderBottomWidth: 6,
								borderBottomColor: "#EBEBEB",
							}}
							className="rounded-2xl w-full max-w-sm"
						>
							<View className="p-8 items-center">
								<View
									style={{
										width: 64,
										height: 64,
										borderWidth: 2,
										borderColor: "#9CA3AF",
										backgroundColor: "#F9FAFB",
									}}
									className="rounded-xl items-center justify-center mb-4"
								>
									<Ionicons name="heart-outline" size={32} color="#9CA3AF" />
								</View>

								<Text className="text-xl font-montserrat-bold text-gray-800 uppercase tracking-wide text-center mb-2">
									No Saved Recipes
								</Text>

								<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-6">
									Tap the heart icon on any recipe to save it here for quick access later
								</Text>

								<Button
									variant="default"
									onPress={() => {
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
										router.push("/");
									}}
									className="w-full"
								>
									<View className="flex-row items-center gap-2">
										<Ionicons name="search" size={18} color="#25551b" />
										<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
											Browse Recipes
										</Text>
									</View>
								</Button>
							</View>
						</View>
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}