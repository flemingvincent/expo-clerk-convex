// Updated MealCard component with add/remove functionality:

import {
	View,
	Pressable,
	TouchableOpacity,
	Animated,
	PanResponder,
	Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/image";
import { getRecipeColorScheme } from "@/lib/colors";
import { usePressAnimation } from "@/hooks/onPressAnimation";
import * as Haptics from "expo-haptics";
import { MealPlanItem } from "@/types/database";
import { useReferenceData } from "@/context/reference-data-provider";
import { Button } from "../ui/button";
import React from "react";

const SWIPE_THRESHOLD = -50;
const SCREEN_WIDTH = Dimensions.get("window").width;

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

	const swipeAnim = React.useRef(new Animated.Value(0)).current;
	const [isSwiping, setIsSwiping] = React.useState(false);

	const panResponder = React.useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => false,
			onMoveShouldSetPanResponder: (evt, gestureState) => {
				// Only activate swipe if we have onRemove and moving horizontally
				return !!(
					editable &&
					isInPlan &&
					onRemove &&
					Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
					Math.abs(gestureState.dx) > 10
				);
			},
			onPanResponderGrant: () => {
				setIsSwiping(true);
			},
			onPanResponderMove: (evt, gestureState) => {
				// Only allow left swipe (negative dx)
				if (gestureState.dx < 0) {
					swipeAnim.setValue(gestureState.dx);
				}
			},
			onPanResponderRelease: (evt, gestureState) => {
				setIsSwiping(false);

				if (gestureState.dx < SWIPE_THRESHOLD) {
					// Trigger removal with animation
					Animated.timing(swipeAnim, {
						toValue: -SCREEN_WIDTH,
						duration: 200,
						useNativeDriver: true,
					}).start(() => {
						handleRemove();
						swipeAnim.setValue(0);
					});
				} else {
					// Snap back to original position
					Animated.spring(swipeAnim, {
						toValue: 0,
						useNativeDriver: true,
						friction: 5,
					}).start();
				}
			},
			onPanResponderTerminate: () => {
				setIsSwiping(false);
				Animated.spring(swipeAnim, {
					toValue: 0,
					useNativeDriver: true,
				}).start();
			},
		}),
	).current;

	const shadowOpacity = swipeAnim.interpolate({
		inputRange: [SWIPE_THRESHOLD, 0],
		outputRange: [0.3, 0],
		extrapolate: "clamp",
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
		<View
			style={{ width: width ? width : "100%", position: "relative" }}
			className="mr-4"
		>
			{/* Red shadow layer that appears behind the card */}
			{editable && isInPlan && onRemove && (
				<Animated.View
					style={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: "#ef4444",
						borderRadius: 16,
						opacity: shadowOpacity,
						shadowColor: "#ef4444",
						shadowOffset: { width: 0, height: 4 },
						shadowOpacity: 0.3,
						shadowRadius: 8,
						elevation: 4,
					}}
				/>
			)}

			<Animated.View
				style={{
					transform: [{ translateX: swipeAnim }],
				}}
				{...(editable && isInPlan && onRemove ? panResponder.panHandlers : {})}
			>
				<Pressable
					onPress={handlePress}
					accessibilityRole="button"
					accessibilityLabel={`View ${recipe.recipe.name} meal`}
					disabled={isSwiping}
					style={{
						width: "100%",
					}}
				>
					{({ pressed }) => (
						<View
							style={{
								backgroundColor: "#FFFFFF",
								height: isCollapsed ? 100 : editable ? 460 : 400,
								borderWidth: 2,
								borderColor: "#EBEBEB",
								borderBottomWidth: pressed && !isSwiping ? 2 : 6,
								borderBottomColor: "#EBEBEB",
								transform: [{ translateY: pressed && !isSwiping ? 4 : 0 }],
							}}
							className="rounded-2xl overflow-hidden"
						>
							{isCollapsed ? (
								<View className="flex-row items-center h-full p-2 pl-1">
									{/* Square Image */}
									<View
										className="w-24 h-24 overflow-hidden rounded-xl"
										style={{
											shadowColor: "#000000",
											shadowOffset: { width: 0, height: 0 },
											shadowOpacity: 0.2,
											shadowRadius: 4,
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
									<View className="flex-1 ml-3 mb-auto">
										<Text
											className="text-base font-montserrat-bold text-gray-700"
											numberOfLines={2}
										>
											{recipe.recipe.name}
										</Text>
										{recipe.recipe.description && (
											<Text
												className="text-sm font-montserrat-medium text-gray-500 mt-1"
												numberOfLines={1}
											>
												{recipe.recipe.description}
											</Text>
										)}
										{/* Servings info */}
										<View className="flex-row items-center gap-3 mt-2">
											<View className="flex-row items-center gap-1">
												<Ionicons
													name="restaurant-outline"
													size={12}
													color="#6b7280"
												/>
												<Text className="text-xs font-montserrat-semibold text-gray-600">
													{recipe.servings}{" "}
													{recipe.servings === 1 ? "serving" : "servings"}
												</Text>
											</View>
										</View>
									</View>

									{/* Servings controls on the right - vertical layout */}
									{editable && isInPlan && (
										<View className="flex-col items-center justify-center ml-3">
											<Pressable
												onPress={handleServingsIncrease}
												className="w-7 h-7 items-center justify-center bg-gray-100 rounded-lg"
												style={({ pressed }) => ({
													transform: [{ translateY: pressed ? 1 : 0 }],
												})}
											>
												<Ionicons name="chevron-up" size={14} color="#4b5563" />
											</Pressable>

											<Text className="text-md font-montserrat-bold text-gray-700 my-1">
												{recipe.servings}
											</Text>

											<Pressable
												onPress={handleServingsDecrease}
												disabled={recipe.servings <= 1}
												className="w-7 h-7 items-center justify-center bg-gray-100 rounded-lg"
												style={({ pressed }) => ({
													transform: [
														{
															translateY:
																pressed && recipe.servings > 1 ? 1 : 0,
														},
													],
												})}
											>
												<Ionicons
													name="chevron-down"
													size={14}
													color={recipe.servings <= 1 ? "#B0B0B0" : "#4b5563"}
												/>
											</Pressable>
										</View>
									)}
								</View>
							) : (
								<>
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
												<Ionicons
													name="heart-outline"
													size={16}
													color="#25551b"
												/>
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
														<Ionicons
															name="restaurant-outline"
															size={14}
															color="#6b7280"
														/>
														<Text className="text-sm font-montserrat-semibold text-gray-600">
															{recipe.servings}{" "}
															{recipe.servings === 1 ? "serving" : "servings"}
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
																{
																	translateY:
																		pressed && recipe.servings > 1 ? 2 : 0,
																},
															],
														})}
													>
														<Ionicons
															name="remove"
															size={18}
															color={
																recipe.servings <= 1 ? "#B0B0B0" : "#4b5563"
															}
														/>
													</Pressable>

													<View className="px-4 justify-center">
														<Text className="text-lg font-montserrat-bold text-gray-600 uppercase tracking-wide">
															{recipe.servings} SERVING
															{recipe.servings > 1 ? "S" : ""}
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
												<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
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
			</Animated.View>
		</View>
	);
};
