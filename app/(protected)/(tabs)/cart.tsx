import { View, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCart } from "@/context/cart-provider";
import { useReferenceData } from "@/context/reference-data-provider";
import * as Haptics from "expo-haptics";
import { useState, useMemo } from "react";

export default function Cart() {
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const { ingredients, totalIngredients, loading, initialized } = useCart();
	const { getTagById, ingredients: referenceIngredients } = useReferenceData();
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

	const toggleRecipes = (itemKey: string) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(itemKey)) {
				newSet.delete(itemKey);
			} else {
				newSet.add(itemKey);
			}
			return newSet;
		});
	};

	const groupedIngredients = useMemo(() => {
		const groups = new Map<
			string,
			{
				categoryName: string;
				items: typeof ingredients;
			}
		>();

		ingredients.forEach((item) => {
			// Filter out water
			if (item.ingredient_name.toLowerCase() === "water") {
				return;
			}

			const categoryId = item.category_id || "uncategorized";
			const category = item.category_id ? getTagById(item.category_id) : null;
			const categoryName = category?.name || "Uncategorized";

			if (!groups.has(categoryId)) {
				groups.set(categoryId, {
					categoryName,
					items: [],
				});
			}

			groups.get(categoryId)!.items.push(item);
		});

		// Convert to array and sort by category name
		return Array.from(groups.entries())
			.map(([id, data]) => ({ id, ...data }))
			.sort((a, b) => {
				// Put uncategorized at the end
				if (a.id === "uncategorized") return 1;
				if (b.id === "uncategorized") return -1;
				return a.categoryName.localeCompare(b.categoryName);
			});
	}, [ingredients, getTagById]);

	const getIngredientImageUrl = (ingredientId: string) => {
		const ingredient = referenceIngredients.find(
			(ing) => ing.id === ingredientId,
		);
		return ingredient?.image_url || null;
	};

	const formatQuantity = (
		quantity: number,
		abbreviation: string | null,
		unitName: string | null,
	) => {
		if (quantity === 0) return "As needed";

		let formattedQty: string;
		const unit = abbreviation || unitName || "units";

		// Handle large quantities - convert g to kg, ml to L
		if (
			(unit === "g" || unit === "gram" || unit === "grams") &&
			quantity >= 1000
		) {
			formattedQty = (quantity / 1000).toFixed(2).replace(/\.?0+$/, "");
			return `${formattedQty} kg`;
		}

		if (
			(unit === "ml" || unit === "milliliter" || unit === "milliliters") &&
			quantity >= 1000
		) {
			formattedQty = (quantity / 1000).toFixed(2).replace(/\.?0+$/, "");
			return `${formattedQty} L`;
		}

		// Format based on magnitude
		if (quantity >= 100) {
			formattedQty = Math.round(quantity).toString();
		} else if (quantity >= 10) {
			formattedQty = quantity.toFixed(1);
		} else if (quantity >= 1) {
			formattedQty = quantity.toFixed(2);
		} else {
			formattedQty = quantity.toFixed(2);
		}

		// Remove trailing zeros
		formattedQty = formattedQty.replace(/\.?0+$/, "");

		return `${formattedQty} ${unit}`;
	};

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		router.back();
	};

	const toggleItemSelection = (itemKey: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSelectedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(itemKey)) {
				newSet.delete(itemKey);
			} else {
				newSet.add(itemKey);
			}
			return newSet;
		});
	};

	if (!initialized || loading) {
		return (
			<SafeAreaView className="flex-1 bg-white">
				<View className="bg-white border-b-2 border-b-[#EBEBEB]">
					<View className="flex-row items-center justify-between px-4 py-3">
						<Pressable
							onPress={handleBack}
							onPressIn={() =>
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
							}
							className="p-2"
						>
							<Ionicons name="arrow-back" size={24} color="#1f2937" />
						</Pressable>

						<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
							Shopping List
						</Text>

						<View className="w-10" />
					</View>
				</View>

				<View className="flex-1 items-center justify-center px-6">
					<View
						style={{
							width: 64,
							height: 64,
							borderWidth: 2,
							borderColor: "#25551b",
							backgroundColor: "#CCEA1F",
						}}
						className="rounded-xl items-center justify-center mb-4"
					>
						<Ionicons name="cart-outline" size={28} color="#25551b" />
					</View>
					<Text className="text-lg font-montserrat-semibold text-gray-600 text-center">
						Loading your shopping list...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (ingredients.length === 0) {
		return (
			<SafeAreaView className="flex-1 bg-white">
				<View className="bg-white border-b-2 border-b-[#EBEBEB]">
					<View className="flex-row items-center justify-between px-4 py-3">
						<Pressable
							onPress={handleBack}
							onPressIn={() =>
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
							}
							className="p-2"
						>
							<Ionicons name="arrow-back" size={24} color="#1f2937" />
						</Pressable>

						<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
							Shopping List
						</Text>

						<View className="w-10" />
					</View>
				</View>

				<View className="flex-1 items-center justify-center px-6">
					<View
						style={{
							width: 80,
							height: 80,
							borderWidth: 2,
							borderColor: "#E5E7EB",
							backgroundColor: "#F9FAFB",
						}}
						className="rounded-xl items-center justify-center mb-6"
					>
						<Ionicons name="cart-outline" size={40} color="#9CA3AF" />
					</View>

					<Text className="text-2xl font-montserrat-bold text-gray-800 mb-2 text-center">
						List is Empty
					</Text>

					<Text className="text-base font-montserrat-medium text-gray-500 text-center mb-8 px-8">
						Add meals to your plan to see ingredients here
					</Text>

					<Button
						variant="default"
						onPress={handleBack}
						onPressIn={() =>
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
						}
						className="w-full max-w-xs"
					>
						<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
							Browse Recipes
						</Text>
					</Button>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View className="flex-1 bg-white">
			{/* Header */}
			<SafeAreaView
				edges={["top"]}
				className="bg-white border-b-2 border-b-[#EBEBEB]"
			>
				<View className="flex-row items-center justify-between px-4 py-3">
					<Pressable
						onPress={handleBack}
						onPressIn={() =>
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
						}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						className="p-2"
					>
						<Ionicons name="arrow-back" size={24} color="#1f2937" />
					</Pressable>

					<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
						Shopping List
					</Text>

					<View className="w-10" />
				</View>
			</SafeAreaView>

			<ScrollView
				className="flex-1 bg-white"
				contentContainerStyle={{ paddingBottom: 100 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Summary Section */}
				<View className="px-6 pt-6 pb-4">
					<Text className="text-xs font-montserrat-bold uppercase tracking-wider text-gray-400 mb-1">
						Total Items
					</Text>
					<Text className="text-3xl font-montserrat-bold text-gray-800">
						{totalIngredients}
					</Text>
				</View>

				{/* Divider */}
				<View className="h-2 bg-gray-100 mb-6" />

				{/* Grouped Ingredients */}
				{groupedIngredients.map((group) => (
					<View key={group.id} className="mb-6">
						<View className="px-6 mb-4">
							<Text className="text-sm font-montserrat-bold uppercase tracking-wider text-gray-500">
								{group.categoryName}
							</Text>
						</View>

						<View className="px-6">
							{group.items.map((item) => {
								const itemKey = `${item.ingredient_id}_${item.unit_id}`;
								const isSelected = selectedItems.has(itemKey);
								const ingredientImageUrl = getIngredientImageUrl(
									item.ingredient_id,
								);
								const showRecipes = expandedItems.has(itemKey);

								return (
									<View key={itemKey} className="border-b border-gray-200">
										<Pressable
											onPress={() => toggleItemSelection(itemKey)}
											className="flex-row items-center py-4"
											style={{ opacity: isSelected ? 0.4 : 1 }}
										>
											{/* Ingredient Image */}
											<View
												className="w-12 h-12 rounded-xl items-center justify-center mr-4 p-2"
												style={{
													backgroundColor: "#FFFFFF",
													borderWidth: 2,
													borderColor: "#E5E7EB",
												}}
											>
												{ingredientImageUrl ? (
													<Image
														source={{ uri: ingredientImageUrl }}
														className="w-full h-full"
														resizeMode="contain"
													/>
												) : (
													<Ionicons
														name="nutrition-outline"
														size={20}
														color="#9CA3AF"
													/>
												)}
											</View>

											{/* Ingredient Info */}
											<View className="flex-1">
												<Text
													className="text-lg font-montserrat-bold text-gray-800 mb-1"
													style={{
														textDecorationLine: isSelected
															? "line-through"
															: "none",
													}}
												>
													{item.ingredient_name}
												</Text>
												<Text className="text-base font-montserrat-medium text-gray-500">
													{formatQuantity(
														item.total_quantity,
														item.unit_abbreviation,
														item.unit_name,
													)}
												</Text>
											</View>

											{/* Checkbox */}
											<View
												style={{
													width: 28,
													height: 28,
													borderWidth: 2,
													borderColor: isSelected ? "#25551b" : "#D1D5DB",
													backgroundColor: isSelected ? "#CCEA1F" : "#FFFFFF",
												}}
												className="rounded-lg items-center justify-center ml-3"
											>
												{isSelected && (
													<Ionicons
														name="checkmark"
														size={18}
														color="#25551b"
													/>
												)}
											</View>
										</Pressable>

										{!isSelected && item.recipes.length > 0 && (
											<View className="pb-3 px-4">
												<Pressable
													onPress={() => {
														Haptics.impactAsync(
															Haptics.ImpactFeedbackStyle.Light,
														);
														toggleRecipes(itemKey); // ✅ Use the toggleRecipes function you already created
													}}
													className="flex-row items-center gap-1.5"
												>
													<Ionicons
														name={showRecipes ? "chevron-up" : "chevron-down"}
														size={14}
														color="#9CA3AF"
													/>
													<Text className="text-xs font-montserrat-semibold text-gray-400 uppercase tracking-wide">
														{item.recipes.length} recipe
														{item.recipes.length !== 1 ? "s" : ""}
													</Text>
												</Pressable>

												{showRecipes && (
													<View className="mt-2 ml-5 gap-1">
														{item.recipes.map((recipe, index) => (
															<View
																key={`${recipe.recipe_id}_${index}`}
																className="flex-row items-center justify-between py-1"
															>
																<Text className="text-sm font-montserrat-medium text-gray-600 flex-1">
																	{recipe.recipe_name}
																</Text>
																<Text className="text-sm font-montserrat-bold text-gray-500 ml-2">
																	{formatQuantity(
																		recipe.quantity,
																		item.unit_abbreviation,
																		item.unit_name,
																	)}
																</Text>
															</View>
														))}
													</View>
												)}
											</View>
										)}
									</View>
								);
							})}
						</View>
					</View>
				))}
			</ScrollView>

			{/* Fixed Bottom Button */}
			<View
				className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-[#EBEBEB] px-6 pt-4 pb-6"
				style={{
					shadowColor: "#000",
					shadowOffset: { width: 0, height: -2 },
					shadowOpacity: 0.1,
					shadowRadius: 8,
					elevation: 8,
				}}
			>
				<Button
					variant="default"
					onPress={() => {
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
						// Handle checkout with grocer
					}}
					className="w-full"
				>
					<View className="flex-row items-center gap-2">
						<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
							Checkout with Grocer
						</Text>
					</View>
				</Button>
			</View>
		</View>
	);
}
