// Updated MealCard component with improved aesthetics:

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
	isCollapsed?: boolean;
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
	isCollapsed = false,
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
						height: isCollapsed ? 110 : editable ? 460 : 400,
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: pressed ? 2 : 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl overflow-hidden"
				>
					{isCollapsed ? (
						<View className="relative flex-row items-center h-full p-1 pl-2 gap-3">
							<View
								className="w-[90px] h-[90px] overflow-hidden rounded-xl flex-shrink-0"
								style={{
									shadowColor: "#000000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.15,
									shadowRadius: 6,
									elevation: 4,
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

							{/* Content */}
							<View className="flex-1 justify-between pr-8 h-full" style={{ height: "66%" }}>
								<Text
									className="text-base font-montserrat-bold text-gray-800 leading-tight"
									numberOfLines={2}
								>
									{recipe.recipe.name}
								</Text>

								<View className="flex-row items-center gap-3 mt-0">
									<View className="flex-row items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
										<Ionicons
											name="restaurant-outline"
											size={13}
											color="#6b7280"
										/>
										<Text className="text-xs font-montserrat-semibold text-gray-700">
											{recipe.servings}{" "}
											{recipe.servings === 1 ? "serving" : "servings"}
										</Text>
									</View>
									
									{recipe.recipe.total_time && (
										<View className="flex-row items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
											<Ionicons
												name="time-outline"
												size={13}
												color="#6b7280"
											/>
											<Text className="text-xs font-montserrat-medium text-gray-500">
												{recipe.recipe.total_time} min
											</Text>
										</View>
									)}
								</View>
							</View>

							{/* Remove button - positioned top right */}
							{editable && isInPlan && onRemove && (
								<View className="absolute top-2 right-2">
									<Pressable
										onPress={handleRemove}
										style={{
											borderWidth: 2,
											borderBottomWidth: 3,
										}}
										className="bg-red-50 border-red-300 border-b-red-400 w-8 h-8 rounded-lg items-center justify-center"
									>
										<Ionicons name="close" size={16} color="#dc2626" />
									</Pressable>
								</View>
							)}
						</View>
					) : (
						<>
							{/* Recipe Image */}
							<View className="relative p-3">
								<View
									className="aspect-[4/3] w-full overflow-hidden rounded-xl"
									style={{
										shadowColor: "#000000",
										shadowOffset: { width: 0, height: 4 },
										shadowOpacity: 0.2,
										shadowRadius: 10,
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
											top: 16,
											right: 16,
											borderWidth: 2,
											borderBottomWidth: 4,
										}}
										className="bg-red-50 border-red-300 border-b-red-400 w-11 h-11 rounded-xl items-center justify-center"
									>
										<Ionicons name="close" size={20} color="#dc2626" />
									</Pressable>
								) : (
									<Pressable
										onPress={handleFavourite}
										style={{
											position: "absolute",
											top: 16,
											right: 16,
											borderWidth: 2,
											borderBottomWidth: 4,
										}}
										className="bg-white border-[#EBEBEB] w-11 h-11 rounded-xl items-center justify-center"
									>
										<Ionicons name="heart-outline" size={18} color="#25551b" />
									</Pressable>
								)}
							</View>

							{/* Content */}
							<View className="flex-1 px-4 pb-2">
								<View className="flex-1">
									<Text
										className="text-xl font-montserrat-bold text-gray-800 leading-tight"
										numberOfLines={2}
									>
										{recipe.recipe.name}
									</Text>

									{recipe.recipe.description && (
										<Text
											className="text-sm font-montserrat-medium text-gray-500 mt-2 leading-snug"
											numberOfLines={2}
										>
											{recipe.recipe.description}
										</Text>
									)}

									{!editable && recipe.servings > 0 && (
										<View className="flex-row items-center gap-3 mt-auto pt-3">
											<View className="flex-row items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg">
												<Ionicons
													name="restaurant-outline"
													size={14}
													color="#6b7280"
												/>
												<Text className="text-sm font-montserrat-semibold text-gray-700">
													{recipe.servings}{" "}
													{recipe.servings === 1 ? "serving" : "servings"}
												</Text>
											</View>
											
											{recipe.recipe.total_time && (
												<View className="flex-row items-center gap-1.5">
													<Ionicons
														name="time-outline"
														size={14}
														color="#6b7280"
													/>
													<Text className="text-sm font-montserrat-medium text-gray-500">
														{recipe.recipe.total_time} min
													</Text>
												</View>
											)}
										</View>
									)}
								</View>
							</View>

							{/* Servings Control */}
							{editable && isInPlan && (
								<View className="px-4 pb-4">
									<View className="items-center">
										<View
											className="w-full bg-white border-[#EBEBEB] flex-row justify-between items-center rounded-xl overflow-hidden"
											style={{
												borderWidth: 2,
												borderBottomWidth: 4,
												height: 52,
											}}
										>
											<Pressable
												onPress={handleServingsDecrease}
												disabled={recipe.servings <= 1}
												className="h-full px-5 items-center justify-center border-r-2 border-input"
												style={({ pressed }) => ({
													transform: [
														{
															translateY:
																pressed && recipe.servings > 1 ? 2 : 0,
														},
													],
												})}
											>
												<Ionicons
													name="remove"
													size={20}
													color={recipe.servings <= 1 ? "#B0B0B0" : "#4b5563"}
												/>
											</Pressable>

											<View className="flex-1 items-center justify-center">
												<Text className="text-base font-montserrat-bold text-gray-700 uppercase tracking-wider">
													{recipe.servings} SERVING
													{recipe.servings > 1 ? "S" : ""}
												</Text>
											</View>

											<Pressable
												onPress={handleServingsIncrease}
												className="h-full px-5 items-center justify-center border-l-2 border-input"
												style={({ pressed }) => ({
													transform: [{ translateY: pressed ? 2 : 0 }],
												})}
											>
												<Ionicons name="add" size={20} color="#4b5563" />
											</Pressable>
										</View>
									</View>
								</View>
							)}

							{/* Add to Plan Button */}
							{editable && !isInPlan && onAdd && (
								<View className="px-4 pb-4">
									<Button
										variant="default"
										onPress={() => onAdd(recipe.id)}
										{...buttonPress}
										className="h-12"
									>
										<Text className="text-[#25551b] font-montserrat-semibold uppercase tracking-wide">
											Add to Plan
										</Text>
									</Button>
								</View>
							)}
						</>
					)}
				</View>
			)}
		</Pressable>
	);
};