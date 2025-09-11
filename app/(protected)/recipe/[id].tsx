import { useEffect, useState, useRef } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	View,
	ScrollView,
	TouchableOpacity,
	Image,
	Dimensions,
	ActivityIndicator,
	Animated,
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

	// Add state for tracking scroll position and title visibility
	const [showHeaderTitle, setShowHeaderTitle] = useState(false);
	const scrollY = useRef(new Animated.Value(0)).current;
	const titleOpacity = useRef(new Animated.Value(0)).current;

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

	// Handle scroll events to show/hide header title
	const handleScroll = Animated.event(
		[{ nativeEvent: { contentOffset: { y: scrollY } } }],
		{
			useNativeDriver: false,
			listener: (event: any) => {
				const offsetY = event.nativeEvent.contentOffset.y;
				// Show title when scrolled past the main title (approximately 500px)
				const shouldShowTitle = offsetY > 500;

				if (shouldShowTitle !== showHeaderTitle) {
					setShowHeaderTitle(shouldShowTitle);
					Animated.timing(titleOpacity, {
						toValue: shouldShowTitle ? 1 : 0,
						duration: 200,
						useNativeDriver: true,
					}).start();
				}
			},
		},
	);

	useEffect(() => {
		fetchRecipe();
	}, [id]);

	const fetchRecipe = async () => {
		if (!id) return;

		try {
			setLoading(true);
			setError(null);

			// Fetch recipe with tags
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

			// Transform recipe data to include tagIds
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

	// Helper function to get unit info by id
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

		// Use abbreviation if available, otherwise use full name
		const unitDisplay = unitInfo.abbreviation || unitInfo.name;
		return `${formattedQuantity} ${unitDisplay}`;
	};

	if (loading) {
		return (
			<SafeAreaView className="flex-1" style={{ backgroundColor: "#CCEA1F" }}>
				<View className="flex-1 items-center justify-center">
					<View
						style={{
							backgroundColor: "#CCEA1F",
							shadowColor: "#CCEA1F",
						}}
						className="w-20 h-20 rounded-2xl items-center justify-center mb-6 shadow-[0px_4px_0px_0px]"
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
			<SafeAreaView className="flex-1" style={{ backgroundColor: "#FFBDBE" }}>
				<View className="flex-1 items-center justify-center p-6">
					<View
						style={{
							backgroundColor: "#FFBDBE",
							shadowColor: "#FFBDBE",
						}}
						className="w-20 h-20 rounded-2xl items-center justify-center mb-6 shadow-[0px_4px_0px_0px]"
					>
						<Ionicons name="alert-circle" size={40} color="#FFF" />
					</View>
					<Text
						style={{ color: "#25551b" }}
						className="text-xl font-montserrat-bold tracking-wide uppercase mb-4 text-center"
					>
						{error || "RECIPE NOT FOUND"}
					</Text>
					<TouchableOpacity
						onPress={() => router.back()}
						style={{
							backgroundColor: "#FFBDBE",
							shadowColor: "#FFBDBE",
						}}
						className="px-6 py-3 rounded-xl shadow-[0px_4px_0px_0px] active:shadow-[0px_0px_0px_0px] active:translate-y-[4px]"
					>
						<Text className="text-primary font-montserrat-bold tracking-wide uppercase">
							GO BACK
						</Text>
					</TouchableOpacity>

					<Button onPress={() => router.back()} variant="funky">
						<View className="flex-row items-center">
							<Text className="font-montserrat-bold tracking-wide uppercase">
								Go Back
							</Text>
						</View>
					</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white" edges={["top"]}>
			{/* Fixed Header with back and favorite buttons */}
			<View
				className="absolute top-12 left-0 right-0 z-20 flex-row justify-between items-center px-3 py-4"
				style={{
					backgroundColor: "#FFFFFF",
					borderBottomWidth: 1,
					borderBottomColor: "#E2E2E2",
				}}
			>
				<TouchableOpacity
					onPress={handleBackPress}
					style={{
						backgroundColor: "#FFF",
						borderColor: "#E2E2E2",
						shadowColor: "#E2E2E2",
					}}
					className="p-3 rounded-xl border-2 shadow-[0px_2px_0px_0px] active:shadow-[0px_0px_0px_0px] active:translate-y-[4px]"
				>
					<Ionicons name="arrow-back" size={24} color="#25551b" />
				</TouchableOpacity>

				{/* Animated Recipe Title in Header */}
				<Animated.View
					style={{
						opacity: titleOpacity,
						flex: 1,
						marginHorizontal: 16,
					}}
					pointerEvents={showHeaderTitle ? "auto" : "none"}
				>
					<Text
						className="text-lg font-montserrat-bold text-center !text-gray-700"
						numberOfLines={2}
						ellipsizeMode="tail"
					>
						{recipe.name}
					</Text>
				</Animated.View>

				<TouchableOpacity
					onPress={handleFavoritePress}
					style={{
						backgroundColor: isFavorited ? "#CCEA1F" : "#FFF",
						borderColor: isFavorited ? "#25551b" : "#E2E2E2",
						shadowColor: isFavorited ? "#25551b" : "#E2E2E2",
					}}
					className="p-3 rounded-xl border-2 shadow-[0px_2px_0px_0px] active:shadow-[0px_0px_0px_0px] active:translate-y-[4px]"
				>
					<Ionicons
						name={isFavorited ? "heart" : "heart-outline"}
						size={24}
						color="#25551b"
					/>
				</TouchableOpacity>
			</View>

			<Animated.ScrollView
				className="flex-1 bg-background"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingTop: 74 }} // Add padding for fixed header
				onScroll={handleScroll}
				scrollEventThrottle={16}
			>
				{/* Recipe Image Card */}
				<View className="px-3 mb-4">
					<View
						style={{
							backgroundColor: "#FFF",
						}}
						className="rounded-2xl overflow-hidden"
					>
						<View className="relative">
							{recipe.image_url ? (
								<Image
									source={{ uri: recipe.image_url }}
									style={{ height: 400 }}
									resizeMode="cover"
								/>
							) : (
								<View
									className="items-center justify-center"
									style={{
										width: screenWidth - 48,
										height: 200,
										backgroundColor: colors.background,
									}}
								>
									<Ionicons
										name="restaurant-outline"
										size={80}
										color={colors.text}
										style={{ opacity: 0.3 }}
									/>
								</View>
							)}

							{/* Enhanced inner shadow overlay - more pronounced than MealCard */}
							<View
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									shadowColor: "#000000",
									shadowOffset: { width: 0, height: 0 },
									shadowOpacity: 0.6, // Increased from 0.4
									shadowRadius: 20, // Increased from 12
									backgroundColor: "transparent",
								}}
								className="rounded-2xl"
								pointerEvents="none"
							/>

							{/* Additional gradient-like inner shadow using multiple overlays */}
							<View
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									backgroundColor: "rgba(0, 0, 0, 0.15)", // Subtle dark overlay
								}}
								className="rounded-2xl"
								pointerEvents="none"
							/>

							{/* Border overlay for crisp edge definition */}
							<View
								style={{
									position: "absolute",
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									borderWidth: 2, // Increased from 1
									borderColor: "rgba(0, 0, 0, 0.2)", // Darker border
								}}
								className="rounded-2xl"
								pointerEvents="none"
							/>
						</View>
					</View>
				</View>

				{/* Recipe Stats - Moved to between image and title */}
				<View className="mb-4">
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 12 }}
					>
						<View className="flex-row gap-3">
							{recipe.prep_time && (
								<View
									style={{
										borderWidth: 1,
										borderColor: colors.text,
										backgroundColor: colors.background,
										shadowColor: colors.text,
									}}
									className="py-2 px-3 gap-1 flex-row justify-center items-center rounded-full mb-2 shadow-[0px_2px_0px_0px]"
								>
									<Ionicons name="time-outline" size={16} color={colors.text} />
									<Text
										className="text-sm font-montserrat-bold text-center"
										style={{ color: colors.text }}
									>
										{recipe.prep_time}m prep time
									</Text>
								</View>
							)}

							{recipe.cook_time && (
								<View
									style={{
										borderWidth: 1,
										borderColor: colors.text,
										backgroundColor: colors.background,
										shadowColor: colors.text,
									}}
									className="py-2 px-3 gap-1 flex-row justify-center items-center rounded-full mb-2 shadow-[0px_2px_0px_0px]"
								>
									<Ionicons
										name="flame-outline"
										size={16}
										color={colors.text}
									/>
									<Text
										className="text-sm font-montserrat-bold text-center"
										style={{ color: colors.text }}
									>
										{recipe.cook_time}m cook time
									</Text>
								</View>
							)}

							<View
								style={{
									borderWidth: 1,
									borderColor: colors.text,
									backgroundColor: colors.background,
									shadowColor: colors.text,
								}}
								className="py-2 px-3 gap-1 flex-row justify-center items-center rounded-full mb-2 shadow-[0px_2px_0px_0px]"
							>
								<Ionicons name="star" size={16} color={colors.text} />
								<Text
									className="text-sm font-montserrat-bold text-center"
									style={{ color: colors.text }}
								>
									Easy
								</Text>
							</View>
						</View>
					</ScrollView>
				</View>

				{/* Recipe Content */}
				<View className="px-6">
					{/* Title and Description */}
					<View className="mb-6">
						<Text
							className="text-3xl font-montserrat-bold mb-3 text-gray-700"
							style={{
								lineHeight: 36,
							}}
						>
							{recipe.name}
						</Text>

						{recipe.description && (
							<Text className="text-base font-montserrat-semibold leading-6 text-gray-500">
								{recipe.description}
							</Text>
						)}
					</View>

					{/* Servings Adjuster */}
					<View
						style={{
							borderWidth: 2,
							borderColor: "#EBEBEB",
							backgroundColor: "#FFFFFF",
							shadowColor: "#EBEBEB",
						}}
						className="border rounded-2xl p-4 mb-4 shadow-[0px_2px_0px_0px]"
					>
						<View className="flex-row items-center justify-between">
							<Text className="text-lg font-montserrat-bold tracking-wide uppercase text-gray-700">
								SERVINGS
							</Text>
							<View className="flex-row items-center">
								<TouchableOpacity
									onPress={() => adjustServings(false)}
									style={{
										borderWidth: 1,
										borderColor: "#EBEBEB",
										backgroundColor: "#FFFFFF",
										shadowColor: "#EBEBEB",
									}}
									className="w-10 h-10 rounded-xl items-center justify-center shadow-[0px_2px_0px_0px] active:shadow-[0px_0px_0px_0px] active:translate-y-[2px]"
								>
									<Ionicons name="remove" size={20} color="#374151" />
								</TouchableOpacity>
								<Text className="mx-6 text-xl font-montserrat-bold text-gray-700">
									{servings}
								</Text>
								<TouchableOpacity
									onPress={() => adjustServings(true)}
									style={{
										borderWidth: 1,
										borderColor: "#EBEBEB",
										backgroundColor: "#FFFFFF",
										shadowColor: "#EBEBEB",
									}}
									className="w-10 h-10 rounded-xl items-center justify-center shadow-[0px_2px_0px_0px] active:shadow-[0px_0px_0px_0px] active:translate-y-[2px]"
								>
									<Ionicons name="add" size={20} color="#374151" />
								</TouchableOpacity>
							</View>
						</View>
					</View>

					<View>
						<View className="flex-row justify-center gap-2 mb-4">
							<Button
								variant={tab === "ingredients" ? "default" : "outline"}
								onPress={() => handleTabChange("ingredients")}
								className="flex-1"
							>
								<Text className="font-montserrat-bold tracking-wide uppercase">
									Ingredients
								</Text>
							</Button>
							<Button
								variant={tab === "instructions" ? "default" : "outline"}
								onPress={() => handleTabChange("instructions")}
								className="flex-1"
							>
								<Text className="font-montserrat-bold tracking-wide uppercase">
									Instructions
								</Text>
							</Button>
						</View>
					</View>

					{/* Ingredients */}
					{tab === "ingredients" && recipeIngredients.length > 0 && (
						<View className="mb-12">
							<View
								style={{
									backgroundColor: "#FFFFFF",
									borderColor: "#EBEBEB",
									shadowColor: "#EBEBEB",
								}}
								className="border-2 rounded-2xl p-4 shadow-[0px_4px_0px_0px]"
							>
								{recipeIngredients.map((recipeIngredient, index) => {
									const ingredientName = getIngredientName(
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
											className="flex-row items-center py-3 border-b border-gray-200 last:border-b-0"
										>
											<View
												className="w-2 h-2 rounded-full mr-4 flex-shrink-0"
												style={{ backgroundColor: "#e5e7eb" }}
											/>
											<View className="flex-1">
												<Text className="text-base font-montserrat-bold text-gray-700">
													{ingredientName}
												</Text>
												{quantityDisplay && (
													<Text className="text-sm font-montserrat-medium mt-1 text-gray-500">
														{quantityDisplay}
													</Text>
												)}
											</View>
										</View>
									);
								})}
							</View>
						</View>
					)}

					{/* Instructions */}
					{tab === "instructions" && instructions.length > 0 && (
						<View className="mb-12">
							<View
								style={{
									backgroundColor: "#FFFFFF",
									borderColor: "#EBEBEB",
									shadowColor: "#EBEBEB",
								}}
								className="border-2 rounded-2xl p-4 shadow-[0px_4px_0px_0px]"
							>
								{instructions.map((instruction, index) => (
									<View
										key={index}
										className="flex-col justify-center items-center py-4 border-b border-gray-200 last:border-b-0"
									>
										{/* image or step number fallback */}
										<View className="w-24 h-24 mb-2">
											{instruction.image_url ? (
												<Image
													source={{ uri: instruction.image_url }}
													className="w-full h-full rounded-lg"
													resizeMode="cover"
												/>
											) : (
												<View className="w-full h-full rounded-full bg-gray-100 items-center justify-center">
													<Text className="text-2xl font-montserrat-bold text-gray-600">
														{index + 1}
													</Text>
												</View>
											)}
										</View>

										{instruction.step_title && (
											<Text className="w-full text-center text-lg font-montserrat-bold mb-2">
												{instruction.step_title}
											</Text>
										)}

										<Text className="flex-1 text-base leading-6 font-montserrat-medium text-gray-500">
											{instruction.instruction}
										</Text>
									</View>
								))}
							</View>
						</View>
					)}
				</View>
			</Animated.ScrollView>
		</SafeAreaView>
	);
}
