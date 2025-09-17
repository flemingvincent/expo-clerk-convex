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
		<SafeAreaView className="flex-1 bg-white" edges={["top"]}>
			<View className="bg-white border-b-2 border-b-[#EBEBEB]">
				<View className="flex-row items-center justify-between px-4 py-3">
					<Pressable
						onPress={handleBackPress}
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						className="p-2"
					>
						<Ionicons name="arrow-back" size={24} color="#1f2937" />
					</Pressable>

					<Animated.View
						style={{
							opacity: titleOpacity,
							flex: 1,
							marginHorizontal: 8,
						}}
						pointerEvents={showHeaderTitle ? "auto" : "none"}
					>
						<Text
							className="text-lg font-montserrat-bold text-center text-gray-800 uppercase tracking-wide"
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{recipe.name}
						</Text>
					</Animated.View>

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
			</View>

			<Animated.ScrollView
				className="flex-1 bg-white"
				showsVerticalScrollIndicator={false}
				onScroll={handleScroll}
				scrollEventThrottle={16}
			>
				<View className="px-4 pt-4 mb-4">
					<View
						style={{
							backgroundColor: "#FFFFFF",
							borderWidth: 2,
							borderColor: "#EBEBEB",
							borderBottomWidth: 6,
							borderBottomColor: "#EBEBEB",
						}}
						className="rounded-2xl overflow-hidden"
					>
						<View className="relative p-2">
							<View
								className="aspect-[4/3] w-full overflow-hidden rounded-xl"
								style={{
									shadowColor: "#000000",
									shadowOffset: { width: 0, height: 0 },
									shadowOpacity: 0.3,
									shadowRadius: 8,
									elevation: 8,
								}}
							>
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
						</View>

						{/* Recipe Info */}
						<View className="p-4">
							{/* Title */}
							<Text
								className="text-2xl font-montserrat-bold text-gray-700 mb-2"
								style={{ lineHeight: 30 }}
							>
								{recipe.name}
							</Text>

							{/* Description */}
							{recipe.description && (
								<Text className="text-base font-montserrat-medium leading-6 text-gray-500 mb-3">
									{recipe.description}
								</Text>
							)}

							{/* Stats Pills - Using recipe's color scheme */}
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								className="mb-3 -mx-4 px-4"
								contentContainerStyle={{ paddingRight: 16 }}
							>
								<View className="flex-row gap-2">
									{recipe.prep_time && (
										<View
											style={{
												backgroundColor: colors.background,
												borderWidth: 2,
												borderColor: colors.text,
												borderBottomWidth: 3,
												borderBottomColor: colors.text,
											}}
											className="py-2 px-3 gap-1.5 flex-row justify-center items-center rounded-lg"
										>
											<Ionicons name="time-outline" size={14} color={colors.text} />
											<Text className="text-xs font-montserrat-bold uppercase tracking-wide" style={{ color: colors.text }}>
												{recipe.prep_time}m prep
											</Text>
										</View>
									)}

									{recipe.cook_time && (
										<View
											style={{
												backgroundColor: colors.background,
												borderWidth: 2,
												borderColor: colors.text,
												borderBottomWidth: 3,
												borderBottomColor: colors.text,
											}}
											className="py-2 px-3 gap-1.5 flex-row justify-center items-center rounded-lg"
										>
											<Ionicons name="flame-outline" size={14} color={colors.text} />
											<Text className="text-xs font-montserrat-bold uppercase tracking-wide" style={{ color: colors.text }}>
												{recipe.cook_time}m cook
											</Text>
										</View>
									)}

									<View
										style={{
											backgroundColor: colors.background,
											borderWidth: 2,
											borderColor: colors.text,
											borderBottomWidth: 3,
											borderBottomColor: colors.text,
										}}
										className="py-2 px-3 gap-1.5 flex-row justify-center items-center rounded-lg"
									>
										<Ionicons name="star" size={14} color={colors.text} />
										<Text className="text-xs font-montserrat-bold uppercase tracking-wide" style={{ color: colors.text }}>
											Easy
										</Text>
									</View>

									{/* Placeholder for future tags - these can be dynamically added later */}
									{/* Example of how additional tags could be added:
									<View
										style={{
											backgroundColor: colors.background,
											borderWidth: 2,
											borderColor: colors.text,
											borderBottomWidth: 3,
											borderBottomColor: colors.text,
										}}
										className="py-2 px-3 gap-1.5 flex-row justify-center items-center rounded-lg"
									>
										<Ionicons name="leaf-outline" size={14} color={colors.text} />
										<Text className="text-xs font-montserrat-bold uppercase tracking-wide" style={{ color: colors.text }}>
											Vegetarian
										</Text>
									</View>
									*/}
								</View>
							</ScrollView>
						</View>
					</View>
				</View>

				{/* Servings Adjuster - matching MealCard style */}
				<View className="px-4 mb-4">
					<View className="items-center">
						<View
							className="w-full bg-white border-[#EBEBEB] flex-row justify-between items-center rounded-xl overflow-hidden"
							style={{
								borderWidth: 2,
								borderBottomWidth: 3,
								height: 50,
							}}
						>
							<Pressable
								onPress={() => adjustServings(false)}
								disabled={servings <= 1}
								className="h-full px-4 items-center justify-center border-r-2 border-[#EBEBEB]"
								style={({ pressed }) => ({
									transform: [{ translateY: pressed && servings > 1 ? 2 : 0 }],
								})}
							>
								<Ionicons
									name="remove"
									size={18}
									color={servings <= 1 ? "#B0B0B0" : "#4b5563"}
								/>
							</Pressable>

							<View className="px-4 justify-center">
								<Text className="text-lg font-montserrat-bold text-gray-600 uppercase tracking-wide">
									{servings} SERVING{servings > 1 ? "S" : ""}
								</Text>
							</View>

							<Pressable
								onPress={() => adjustServings(true)}
								className="h-full px-4 items-center justify-center border-l-2 border-[#EBEBEB]"
								style={({ pressed }) => ({
									transform: [{ translateY: pressed ? 2 : 0 }],
								})}
							>
								<Ionicons name="add" size={18} color="#4b5563" />
							</Pressable>
						</View>
					</View>
				</View>

				{/* Tab Buttons */}
				<View className="px-4 mb-4">
					<View className="flex-row gap-2">
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

				{/* Content based on tab */}
				<View className="px-4 pb-6">
					{/* Ingredients */}
					{tab === "ingredients" && recipeIngredients.length > 0 && (
						<View
							style={{
								backgroundColor: "#FFFFFF",
								borderWidth: 2,
								borderColor: "#EBEBEB",
								borderBottomWidth: 6,
								borderBottomColor: "#EBEBEB",
							}}
							className="rounded-2xl p-4"
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
										className="flex-row items-start py-3 border-b border-gray-200 last:border-b-0"
									>
										<View
											className="w-6 h-6 rounded-md mr-3 mt-0.5 items-center justify-center"
											style={{ 
												backgroundColor: colors.background,
												borderWidth: 1,
												borderColor: colors.text,
											}}
										>
											<Ionicons name="checkmark" size={12} color={colors.text} />
										</View>
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
					)}

					{/* Instructions */}
					{tab === "instructions" && instructions.length > 0 && (
						<View
							style={{
								backgroundColor: "#FFFFFF",
								borderWidth: 2,
								borderColor: "#EBEBEB",
								borderBottomWidth: 6,
								borderBottomColor: "#EBEBEB",
							}}
							className="rounded-2xl p-4"
						>
							{instructions.map((instruction, index) => (
								<View
									key={index}
									className="flex-col justify-center items-center py-4 border-b border-gray-200 last:border-b-0"
								>
									{/* image or step number fallback */}
									<View className="w-24 h-24 mb-3">
										{instruction.image_url ? (
											<Image
												source={{ uri: instruction.image_url }}
												className="w-full h-full rounded-lg"
												resizeMode="cover"
											/>
										) : (
											<View 
												className="w-full h-full rounded-full items-center justify-center"
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

									{instruction.step_title && (
										<Text className="w-full text-center text-lg font-montserrat-bold mb-2 text-gray-700">
											{instruction.step_title}
										</Text>
									)}

									<Text className="text-base leading-6 font-montserrat-medium text-gray-600 text-center">
										{instruction.instruction}
									</Text>
								</View>
							))}
						</View>
					)}
				</View>

				{/* Action Button */}
				<View className="px-4 pb-12">
					<Button
						variant="default"
						className="w-full"
                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
					>
						<View className="flex-row items-center gap-2">
							<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
								Add to Plan
							</Text>
						</View>
					</Button>
				</View>
			</Animated.ScrollView>
		</SafeAreaView>
	);
}