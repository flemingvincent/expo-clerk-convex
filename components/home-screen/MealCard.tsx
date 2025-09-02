// Updated MealCard component with add/remove functionality:

import { View, Pressable, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/image";
import { getRecipeColorScheme } from "@/lib/colors";
import { usePressAnimation } from "@/hooks/onPressAnimation";
import * as Haptics from "expo-haptics";
import { MealPlanItem } from "@/types/database";
import { useReferenceData } from "@/context/reference-data-provider";
import { Button } from "../ui/button";

interface MealCardProps {
	recipe: MealPlanItem;
	onPress?: () => void;
	onServingsChange?: (mealId: string, servings: number) => void;
	onRemove?: (mealId: string) => void;
	onAdd?: (mealId: string) => void;
	width?: number;
	editable?: boolean;
	isInPlan?: boolean;
}

export const MealCard = ({
	recipe,
	onPress,
	onServingsChange,
	onRemove,
	onAdd,
	width,
	editable = false,
	isInPlan = true,
}: MealCardProps) => {
	const { tags } = useReferenceData();
	const colors = getRecipeColorScheme(recipe.recipe.tagIds, tags);

	const buttonPress = usePressAnimation({
		hapticStyle: "Medium",
		pressDistance: 2,
	});

	const handlePress = () => {
		if (onPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			onPress();
		}
	};

	const handleServingsDecrease = () => {
		if (recipe.servings > 1 && onServingsChange) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onServingsChange(recipe.id, recipe.servings - 1);
		}
	};

	const handleServingsIncrease = () => {
		if (onServingsChange) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			onServingsChange(recipe.id, recipe.servings + 1);
		}
	};

	const handleRemove = () => {
		if (onRemove) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			onRemove(recipe.id);
		}
	};

	const handleFavourite = () => {
		if (onAdd) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		}
	};

	return (
		<Pressable
			onPress={handlePress}
			accessibilityRole="button"
			accessibilityLabel={`View ${recipe.recipe.name} meal`}
			style={{
				width: width ? width : "100%",
			}}
			className="mr-4"
		>
			{({ pressed }) => (
				<View
					style={{
						backgroundColor: "#FFFFFF",
						height: editable ? 460 : 400,
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: pressed ? 2 : 6,
						borderBottomColor: "#EBEBEB",
						transform: [{ translateY: pressed ? 4 : 0 }],
					}}
					className="rounded-2xl overflow-hidden"
				>
					{/* Recipe Image */}
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
							<Image
								source={
									typeof recipe.recipe.image_url === "string"
										? { uri: recipe.recipe.image_url }
										: recipe.recipe.image_url
								}
								className="w-full h-full"
								contentFit="cover"
							/>
						</View>

						{editable && isInPlan && onRemove ? (
							<Pressable
								onPress={handleRemove}
								style={{
									position: "absolute",
									top: 12,
									right: 12,
									borderWidth: 2,
									borderBottomWidth: 4,
								}}
								className="bg-red-100 border-red-400 border-b-red-600 text-red-600 w-12 h-12 rounded-lg items-center justify-center"
							>
								<Ionicons name="close" size={22} color="#dc2626" />
							</Pressable>
						) : (
							<Pressable
								onPress={handleFavourite}
								style={{
									position: "absolute",
									top: 12,
									right: 12,
									borderWidth: 2,
									borderBottomWidth: 4,
								}}
								className="bg-white border-[#EBEBEB] w-10 h-10 rounded-lg items-center justify-center"
							>
								<Ionicons name="heart-outline" size={16} color="#25551b" />
							</Pressable>
						)}
					</View>

					<View className="flex-1 p-4">
						<View className="flex-1">
							<View className="flex-row items-center gap-2 mt-1">
								<Text
									className="text-xl font-montserrat-bold text-gray-700 leading-tight flex-1"
									numberOfLines={2}
								>
									{recipe.recipe.name}
								</Text>
							</View>

							{recipe.recipe.description && (
								<Text
									className="text-sm font-montserrat-medium text-gray-500 mt-2 leading-5"
									numberOfLines={2}
								>
									{recipe.recipe.description}
								</Text>
							)}

							{!editable && recipe.servings > 0 && (
                                <View className="flex-row items-center gap-2 mt-auto">
                                    <View className="flex-row items-center gap-1">
                                        <Ionicons name="restaurant-outline" size={14} color="#6b7280" />
                                        <Text className="text-sm font-montserrat-semibold text-gray-600">
                                            {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                                        </Text>
                                    </View>
                                </View>
                            )}
						</View>
					</View>

					{editable && isInPlan && (
						<View className="px-4 pb-3">
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
										onPress={handleServingsDecrease}
										disabled={recipe.servings <= 1}
										className="h-full px-4 items-center justify-center border-r-2 border-input"
										style={({ pressed }) => ({
											transform: [
												{ translateY: pressed && recipe.servings > 1 ? 2 : 0 },
											],
										})}
									>
										<Ionicons
											name="remove"
											size={18}
											color={recipe.servings <= 1 ? "#B0B0B0" : "#4b5563"}
										/>
									</Pressable>

									<View className="px-4 justify-center">
										<Text className="text-lg font-montserrat-bold text-gray-600 uppercase tracking-wide">
											{recipe.servings} SERVING{recipe.servings > 1 ? "S" : ""}
										</Text>
									</View>

									<Pressable
										onPress={handleServingsIncrease}
										className="h-full px-4 items-center justify-center border-l-2 border-input"
										style={({ pressed }) => ({
											transform: [{ translateY: pressed ? 2 : 0 }],
										})}
									>
										<Ionicons name="add" size={18} color="#4b5563" />
									</Pressable>
								</View>
							</View>
						</View>
					)}

					{editable && !isInPlan && onAdd && (
						<View className="px-4 pb-4">
							<Button
								variant="default"
								onPress={() => onAdd(recipe.id)}
								{...buttonPress}
							>
								<Text className="text-[#25551b] font-montserrat-semibold uppercase tracking-wide">
									Add to Plan
								</Text>
							</Button>
						</View>
					)}
				</View>
			)}
		</Pressable>
	);
};
