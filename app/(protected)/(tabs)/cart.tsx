import { View, ScrollView, Pressable } from "react-native";
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
	const { ingredients, totalIngredients, loading, initialized } = useCart();
	const { getTagById } = useReferenceData();
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

	// Group ingredients by category
	const groupedIngredients = useMemo(() => {
		const groups = new Map<string, {
			categoryName: string;
			items: typeof ingredients;
		}>();

		ingredients.forEach((item) => {
			const categoryId = item.category_id || 'uncategorized';
			const category = item.category_id ? getTagById(item.category_id) : null;
			const categoryName = category?.name || 'Uncategorized';

			if (!groups.has(categoryId)) {
				groups.set(categoryId, {
					categoryName,
					items: []
				});
			}

			groups.get(categoryId)!.items.push(item);
		});

		// Convert to array and sort by category name
		return Array.from(groups.entries())
			.map(([id, data]) => ({ id, ...data }))
			.sort((a, b) => {
				// Put uncategorized at the end
				if (a.id === 'uncategorized') return 1;
				if (b.id === 'uncategorized') return -1;
				return a.categoryName.localeCompare(b.categoryName);
			});
	}, [ingredients, getTagById]);

	const formatQuantity = (
		quantity: number,
		abbreviation: string | null,
		unitName: string | null
	) => {
		if (quantity === 0) return "As needed";
		
		// Format number to avoid long decimals
		const formattedQty =
			quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
		const unit = abbreviation || unitName || "units";
		return `${formattedQty} ${unit}`;
	};

	const handleBack = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
		router.back();
	};

	const toggleItemSelection = (itemKey: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setSelectedItems(prev => {
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
			<SafeAreaView className="flex-1 bg-background">
				<View className="bg-white border-b-2 border-b-[#EBEBEB]">
					<View className="flex-row items-center justify-between px-4 py-3">
						<Pressable
							onPress={handleBack}
							onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
							className="p-2"
						>
							<Ionicons name="arrow-back" size={24} color="#1f2937" />
						</Pressable>

						<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
							Shopping Cart
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
			<SafeAreaView className="flex-1 bg-background">
				<View className="bg-white border-b-2 border-b-[#EBEBEB]">
					<View className="flex-row items-center justify-between px-4 py-3">
						<Pressable
							onPress={handleBack}
							onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
							className="p-2"
						>
							<Ionicons name="arrow-back" size={24} color="#1f2937" />
						</Pressable>

						<Text className="text-lg font-montserrat-bold text-gray-800 uppercase tracking-wide">
							Shopping Cart
						</Text>

						<View className="w-10" />
					</View>
				</View>

				<View className="flex-1 items-center justify-center px-4">
					<View
						style={{
							backgroundColor: "#FFFFFF",
							borderWidth: 2,
							borderColor: "#EBEBEB",
							borderBottomWidth: 6,
							borderBottomColor: "#EBEBEB",
						}}
						className="w-full rounded-2xl overflow-hidden"
					>
						<View className="p-6 items-center">
							<View
								style={{
									width: 64,
									height: 64,
									borderWidth: 2,
									borderColor: "#6b7280",
									backgroundColor: "#f9fafb",
								}}
								className="rounded-xl items-center justify-center mb-4"
							>
								<Ionicons name="cart-outline" size={28} color="#6b7280" />
							</View>

							<Text className="text-xl font-montserrat-bold text-gray-800 uppercase tracking-wide text-center mb-2">
								Cart is Empty
							</Text>

							<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-6 px-4">
								Add meals to your plan to see ingredients here
							</Text>

							<Button
								variant="default"
								onPress={handleBack}
								onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
								className="w-full"
							>
								<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
									Go Back
								</Text>
							</Button>
						</View>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<View className="flex-1 bg-white">
			<ScrollView 
				className="flex-1 bg-background" 
				contentContainerStyle={{ padding: 16, paddingTop: 64 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="mb-4">
					<Text className="text-2xl font-montserrat-bold text-gray-800">
						Your Shopping List
					</Text>
					<Text className="text-lg font-montserrat-semibold text-gray-600">
						{totalIngredients} ingredient{totalIngredients !== 1 ? "s" : ""} needed
					</Text>
				</View>

				{groupedIngredients.map((group) => (
					<View key={group.id} className="mb-6">
						<View className="mb-3 px-2">
							<Text className="text-sm font-montserrat-bold text-gray-500 uppercase tracking-wider">
								{group.categoryName}
							</Text>
							<View className="h-0.5 bg-gray-200 mt-1" />
						</View>

						<View className="gap-2">
							{group.items.map((item) => {
								const itemKey = `${item.ingredient_id}_${item.unit_id}`;
								const isSelected = selectedItems.has(itemKey);
								
								return (
									<Pressable 
										key={itemKey}
										onPress={() => toggleItemSelection(itemKey)}
										style={{
											backgroundColor: "#FFFFFF",
											borderWidth: 2,
											borderColor: "#EBEBEB",
											borderBottomWidth: 4,
											borderBottomColor: "#EBEBEB",
											opacity: isSelected ? 0.5 : 1,
										}}
										className="rounded-2xl overflow-hidden p-4"
									>
										<View className="flex-row items-start justify-between">
											<View className="flex-1">
												<Text className="text-lg font-montserrat-bold text-gray-800">
													{item.ingredient_name}
												</Text>
												
												<View
													style={{
														backgroundColor: "#CCEA1F",
														borderWidth: 1,
														borderColor: "#25551b",
													}}
													className="self-start px-3 py-1 rounded-lg mt-2"
												>
													<Text className="text-sm font-montserrat-bold text-[#25551b] uppercase tracking-wide">
														{formatQuantity(
															item.total_quantity,
															item.unit_abbreviation,
															item.unit_name
														)}
													</Text>
												</View>
											</View>

											<View className="ml-4">
												<View
													style={{
														width: 32,
														height: 32,
														borderWidth: 2,
														borderColor: isSelected ? "#25551b" : "#6b7280",
														backgroundColor: isSelected ? "#CCEA1F" : "#FFFFFF",
													}}
													className="rounded-lg items-center justify-center"
												>
													{isSelected && (
														<Ionicons 
															name="checkmark" 
															size={16} 
															color="#25551b" 
														/>
													)}
												</View>
											</View>
										</View>

										{!isSelected && item.recipes.length > 0 && (
											<View className="mt-3 pt-3 border-t border-gray-100">
												<Text className="text-xs font-montserrat-semibold text-gray-500 uppercase tracking-wide mb-2">
													Used in:
												</Text>
												{item.recipes.map((recipe, index) => (
													<View key={`${recipe.recipe_id}_${index}`} className="flex-row items-center gap-2 mb-1">
														<View className="w-1 h-1 rounded-full bg-gray-400" />
														<Text className="text-sm font-montserrat-medium text-gray-600">
															{recipe.recipe_name} ({recipe.servings} serving{recipe.servings !== 1 ? "s" : ""})
														</Text>
													</View>
												))}
											</View>
										)}
									</Pressable>
								);
							})}
						</View>
					</View>
				))}
			</ScrollView>

			<View className="bg-white border-t-2 border-[#EBEBEB] p-4 pb-5">
				<Button
					variant="default"
					onPress={() => {
						// Handle checkout with grocer
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
					}}
					className="w-full"
				>
					<View className="flex-row items-center gap-2">
						<Ionicons name="storefront" size={18} color="#25551b" />
						<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
							Checkout with Grocer
						</Text>
					</View>
				</Button>
			</View>
		</View>
	);
}