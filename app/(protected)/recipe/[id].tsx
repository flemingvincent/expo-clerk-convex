import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	View,
	ScrollView,
	Image,
	Dimensions,
	ActivityIndicator,
	Animated,
	Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "@/config/supabase";

import { SafeAreaView } from "@/components/safe-area-view";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { getRecipeColorScheme } from "@/lib/colors";
import { Instruction, RecipeIngredient, RecipeWithTags } from "@/types/database";
import { useReferenceData } from "@/context/reference-data-provider";
import { useUserPreferences } from "@/context/user-preferences-provider";

const { width: screenWidth } = Dimensions.get("window");

export default function RecipeDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { tags, ingredients, units } = useReferenceData();
	const { preferences } = useUserPreferences();
	const [recipe, setRecipe] = useState<RecipeWithTags | null>(null);
	const [recipeIngredients, setRecipeIngredients] = useState<
		RecipeIngredient[]
	>([]);
	const [instructions, setInstructions] = useState<Instruction[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isFavorited, setIsFavorited] = useState(false);
	const [servings, setServings] = useState(preferences?.serves_per_meal ?? 2);
	const [tab, setTab] = useState<"ingredients" | "instructions">("ingredients");

	const scrollY = useRef(new Animated.Value(0)).current;
	const headerOpacity = scrollY.interpolate({
		inputRange: [0, 100],
		outputRange: [0, 1],
		extrapolate: "clamp",
	});

	// Get dynamic colors based on recipe tags
	const colors = recipe
		? getRecipeColorScheme(recipe.tagIds, tags)
		: {
				text: "#FF6525",
				background: "#FFE0D1",
			};

	const adjustServings = (increment: boolean) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setServings((prev) => Math.max(1, increment ? prev + 1 : prev - 1));
	};

	const handleTabChange = (toTab: "ingredients" | "instructions") => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setTab(toTab);
	};

	useEffect(() => {
		fetchRecipe();
	}, [id]);

	const fetchRecipe = async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);

			const { data: recipe, error: recipeError } = await supabase
				.from("recipe")
				.select(
					`
					*,
					recipe_tags(
						tag_id
					)
				`,
				)
				.eq("id", id)
				.single();

			if (recipeError) {
				console.error("Error fetching recipe:", recipeError);
				setError(recipeError.message);
				return;
			}

			const recipeWithTags = {
				...recipe,
				tagIds:
					recipe.recipe_tags?.map((rt: any) => rt.tag_id).filter(Boolean) || [],
			};

			const { data: ingredientsData, error: ingredientsError } = await supabase
				.from("recipe_ingredients")
				.select("*")
				.eq("recipe_id", id)
				.order("id");

			if (ingredientsError) {
				console.error("Error fetching ingredients:", ingredientsError);
				setError(ingredientsError.message);
				return;
			}

			const { data: instructionsData, error: instructionsError } =
				await supabase
					.from("instructions")
					.select("*")
					.eq("recipe_id", id)
					.order("step_number");

			if (instructionsError) {
				console.error("Error fetching instructions:", instructionsError);
				setError(instructionsError.message);
				return;
			}

			setRecipe(recipeWithTags);
			setRecipeIngredients(ingredientsData || []);
			setInstructions(instructionsData || []);
			setServings(preferences?.serves_per_meal ?? recipeWithTags.default_servings ?? 4);
		} catch (err) {
			console.error("Unexpected error:", err);
			setError("Failed to fetch recipe");
		} finally {
			setLoading(false);
		}
	};

	const handleBackPress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.back();
	};

	const handleFavoritePress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsFavorited(!isFavorited);
	};

	const getIngredientName = (ingredientId: string) => {
		const ingredient = ingredients.find((ing) => ing.id === ingredientId);
		return ingredient?.name || ingredientId;
	};

	const getIngredientImageUrl = (ingredientId: string) => {
		const ingredient = ingredients.find((ing) => ing.id === ingredientId);
		return ingredient?.image_url || null;
	};

	const getUnitInfo = (unitId?: string) => {
		if (!unitId) return null;
		const unit = units.find((u) => u.id === unitId);
		return unit;
	};

	const formatQuantity = (quantity?: number, unitInfo?: any) => {
		if (!quantity) return "";

		const formattedQuantity =
			quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);

		if (!unitInfo) return formattedQuantity;

		const unitDisplay = unitInfo.abbreviation || unitInfo.name;
		return `${formattedQuantity} ${unitDisplay}`;
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1 bg-white">
				<View className="flex-1 items-center justify-center">
					<View
						style={{
							backgroundColor: "#CCEA1F",
							borderWidth: 2,
							borderColor: "#25551b",
						}}
						className="w-20 h-20 rounded-xl items-center justify-center mb-6"
					>
						<Ionicons name="restaurant" size={40} color="#25551b" />
					</View>
					<Text
						style={{ color: "#25551b" }}
						className="text-xl font-montserrat-bold tracking-wide uppercase"
					>
						LOADING RECIPE
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (error || !recipe) {
		return (
			<SafeAreaView className="flex-1 bg-white">
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
						{error || "RECIPE NOT FOUND"}
					</Text>
					<Button 
                        onPress={() => router.back()} 
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        variant="outline" >
						<Text className="font-montserrat-bold tracking-wide uppercase">
							Go Back
						</Text>
					</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View className="flex-1 bg-white">
			{/* Floating Header */}
			<Animated.View
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 10,
					backgroundColor: "white",
					opacity: headerOpacity,
				}}
				className="border-b-2 border-b-[#EBEBEB]"
			>
				<SafeAreaView edges={["top"]}>
					<View className="flex-row items-center justify-between px-4 py-3">
						<Pressable
							onPress={handleBackPress}
							onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							className="p-2"
						>
							<Ionicons name="arrow-back" size={24} color="#1f2937" />
						</Pressable>

						<Text
							className="text-lg font-montserrat-bold text-center text-gray-800 uppercase tracking-wide flex-1 mx-2"
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{recipe.name}
						</Text>

						<Pressable
							onPress={handleFavoritePress}
							onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							className="p-2"
						>
							<Ionicons
								name={isFavorited ? "heart" : "heart-outline"}
								size={24}
								color={isFavorited ? "#dc2626" : "#1f2937"}
							/>
						</Pressable>
					</View>
				</SafeAreaView>
			</Animated.View>

			{/* Floating Action Buttons */}
			<SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 9 }}>
				<View className="flex-row items-center justify-between px-4 py-3">
					<Pressable
						onPress={handleBackPress}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							padding: 8,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 3,
						}}
					>
						<Ionicons name="arrow-back" size={24} color="#1f2937" />
					</Pressable>

					<Pressable
						onPress={handleFavoritePress}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						style={{
							backgroundColor: "white",
							borderRadius: 12,
							padding: 8,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 3,
						}}
					>
						<Ionicons
							name={isFavorited ? "heart" : "heart-outline"}
							size={24}
							color={isFavorited ? "#dc2626" : "#1f2937"}
						/>
					</Pressable>
				</View>
			</SafeAreaView>

			<Animated.ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				onScroll={Animated.event(
					[{ nativeEvent: { contentOffset: { y: scrollY } } }],
					{ useNativeDriver: true }
				)}
				scrollEventThrottle={16}
			>
				{/* Full Width Hero Image */}
				<View className="w-full" style={{ height: screenWidth }}>
					{recipe.image_url ? (
						<Image
							source={{ uri: recipe.image_url }}
							style={{ width: "100%", height: "100%" }}
							resizeMode="cover"
						/>
					) : (
						<View
							className="w-full h-full items-center justify-center"
							style={{ backgroundColor: colors.background }}
						>
							<Ionicons
								name="restaurant-outline"
								size={80}
								color={colors.text}
								style={{ opacity: 0.3 }}
							/>
						</View>
					)}
				</View>

				{/* Recipe Info Section */}
				<View className="px-6 pt-6 pb-4">
					<Text
						className="text-3xl font-montserrat-bold text-gray-800 mb-3"
						style={{ lineHeight: 38 }}
					>
						{recipe.name}
					</Text>

					{recipe.description && (
						<Text className="text-base font-montserrat-medium leading-6 text-gray-600 mb-4">
							{recipe.description}
						</Text>
					)}

					{/* Stats */}
					<View className="flex-row justify-between mt-6 mb-4">
						{recipe.prep_time && (
							<View className="items-start">
								<Text className="text-xs font-montserrat-bold uppercase tracking-wider text-gray-400 mb-1">
									Prep Time
								</Text>
								<Text className="text-2xl font-montserrat-bold text-gray-800">
									{recipe.prep_time}<Text className="text-base text-gray-500">m</Text>
								</Text>
							</View>
						)}

						{recipe.cook_time && (
							<View className="items-start">
								<Text className="text-xs font-montserrat-bold uppercase tracking-wider text-gray-400 mb-1">
									Cook Time
								</Text>
								<Text className="text-2xl font-montserrat-bold text-gray-800">
									{recipe.cook_time}<Text className="text-base text-gray-500">m</Text>
								</Text>
							</View>
						)}

						<View className="items-start">
							<Text className="text-xs font-montserrat-bold uppercase tracking-wider text-gray-400 mb-1">
								Difficulty
							</Text>
							<Text className="text-2xl font-montserrat-bold text-gray-800">
								Easy
							</Text>
						</View>
					</View>
				</View>

				{/* Divider */}
				<View className="h-2 bg-gray-100 mb-6" />

				{/* Servings Adjuster */}
				<View className="px-6 mb-6">
					<View className="flex-row items-center justify-between">
						<View>
							<Text className="text-xs font-montserrat-bold uppercase tracking-wider text-gray-400 mb-1">
								Servings
							</Text>
							<Text className="text-2xl font-montserrat-bold text-gray-800">
								{servings}
							</Text>
						</View>

						<View className="flex-row gap-2">
							<Pressable
								onPress={() => adjustServings(false)}
								disabled={servings <= 1}
								style={{
									backgroundColor: servings <= 1 ? "#F3F4F6" : "#FFFFFF",
									borderWidth: 2,
									borderColor: servings <= 1 ? "#E5E7EB" : "#5C5C5C",
									borderBottomWidth: servings <= 1 ? 2 : 4,
								}}
								className="w-12 h-12 rounded-xl items-center justify-center"
							>
								<Ionicons
									name="remove"
									size={22}
									color={servings <= 1 ? "#B0B0B0" : "#4b5563"}
								/>
							</Pressable>

							<Pressable
								onPress={() => adjustServings(true)}
								style={{
									backgroundColor: "#FFFFFF",
									borderWidth: 2,
									borderColor: "#5C5C5C",
									borderBottomWidth: 4,
								}}
								className="w-12 h-12 rounded-xl items-center justify-center"
							>
								<Ionicons name="add" size={22} color="#4b5563" />
							</Pressable>
						</View>
					</View>
				</View>

				{/* Divider */}
				<View className="h-2 bg-gray-100 mb-6" />

				{/* Tab Buttons */}
				<View className="px-6 mb-6">
					<View className="flex-row gap-3">
						<Button
							variant={tab === "ingredients" ? "default" : "outline"}
							onPress={() => handleTabChange("ingredients")}
							onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							className="flex-1"
						>
							<Text className="font-montserrat-bold tracking-wide uppercase">
								Ingredients
							</Text>
						</Button>
						<Button
							variant={tab === "instructions" ? "default" : "outline"}
							onPress={() => handleTabChange("instructions")}
							onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							className="flex-1"
						>
							<Text className="font-montserrat-bold tracking-wide uppercase">
								Instructions
							</Text>
						</Button>
					</View>
				</View>

				{/* Content */}
				<View className="px-6 pb-6">
					{/* Ingredients */}
					{tab === "ingredients" && recipeIngredients.length > 0 && (
						<View>
							{recipeIngredients.map((recipeIngredient, index) => {
								const ingredientName = getIngredientName(
									recipeIngredient.ingredient_id,
								);
								const ingredientImageUrl = getIngredientImageUrl(
									recipeIngredient.ingredient_id,
								);
								const unitInfo = getUnitInfo(recipeIngredient.unit_id);
								const adjustedQuantity = recipeIngredient.quantity_per_serving
									? recipeIngredient.quantity_per_serving * servings
									: undefined;
								const quantityDisplay = formatQuantity(
									adjustedQuantity,
									unitInfo,
								);

								return (
									<View
										key={index}
										className="flex-row items-center py-4 border-b border-gray-200"
									>
										<View 
											className="w-12 h-12 rounded-xl items-center justify-center mr-4 p-2"
											style={{ 
												backgroundColor: "#FFFFFF",
												borderWidth: 2,
												borderColor: "#5C5C5C",
											}}
										>
											{ingredientImageUrl ? (
												<Image
													source={{ uri: ingredientImageUrl }}
													className="w-full h-full"
													resizeMode="contain"
												/>
											) : (
												<Ionicons name="nutrition-outline" size={20} color="#9CA3AF" />
											)}
										</View>
										<View className="flex-1">
											<Text className="text-lg font-montserrat-bold text-gray-800 mb-1">
												{ingredientName}
											</Text>
											{quantityDisplay && (
												<Text className="text-base font-montserrat-medium text-gray-500">
													{quantityDisplay}
												</Text>
											)}
										</View>
									</View>
								);
							})}
						</View>
					)}

					{/* Instructions */}
					{tab === "instructions" && instructions.length > 0 && (
						<View>
							{instructions.map((instruction, index) => (
								<View
									key={index}
									className="py-6 border-b border-gray-200"
								>
									<View className="flex-row items-start mb-4">
										<View className="mr-4">
											{instruction.image_url ? (
												<Image
													source={{ uri: instruction.image_url }}
													className="w-20 h-20 rounded-xl"
													resizeMode="cover"
												/>
											) : (
												<View 
													className="w-20 h-20 rounded-full items-center justify-center"
													style={{
														backgroundColor: colors.background,
														borderWidth: 2,
														borderColor: colors.text,
													}}
												>
													<Text className="text-2xl font-montserrat-bold" style={{ color: colors.text }}>
														{index + 1}
													</Text>
												</View>
											)}
										</View>

										<View className="flex-1">
											{instruction.step_title && (
												<Text className="text-xl font-montserrat-bold mb-2 text-gray-800">
													{instruction.step_title}
												</Text>
											)}

											<Text className="text-base leading-6 font-montserrat-medium text-gray-600">
												{instruction.instruction}
											</Text>
										</View>
									</View>
								</View>
							))}
						</View>
					)}
				</View>

				{/* Action Button */}
				<View className="px-6 pb-12">
					<Button
						variant="default"
						className="w-full"
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
					>
						<View className="flex-row items-center gap-2">
							<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide text-base">
								Add to Plan
							</Text>
						</View>
					</Button>
				</View>
			</Animated.ScrollView>
		</View>
	);
}