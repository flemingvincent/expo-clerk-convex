import React, { useState, useEffect, useRef } from "react";
import {
	View,
	ScrollView,
	Pressable,
	Animated,
	ActivityIndicator,
	LayoutAnimation,
	UIManager,
	Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import { useReferenceData } from "@/context/reference-data-provider";
import { supabase } from "@/config/supabase";
import type { Tables } from "@/types/supabase";
import type { Tag, TagType } from "@/types/database";
import { AVAILABLE_GOALS, GoalMetadata, UserGoal } from "@/constants/onboarding";

// Enable LayoutAnimation on Android
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

type UserPreferences = Tables<"user_preferences">;
type UserPreferenceTag = {
	tag_id: string;
};

type GroupedTags = Record<string, Tag[]>;

export default function EditPreferences() {
	const { session } = useAuth();
	const { tags, getTagsByType } = useReferenceData();

	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	// Form state
	const [mealsPerWeek, setMealsPerWeek] = useState(5);
	const [servesPerMeal, setServesPerMeal] = useState(4);
	const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
	const [orderedGoals, setOrderedGoals] = useState<GoalMetadata[]>([]);
	const [userPreferenceTags, setUserPreferenceTags] = useState<UserPreferenceTag[]>([]);
	const [animatingGoalIndex, setAnimatingGoalIndex] = useState<number | null>(null);

	const [mealTypeTags, setMealTypeTags] = useState<Tag[]>([]);
	const [groupedTags, setGroupedTags] = useState<GroupedTags>({});

	const user = session?.user;

	// Animation values
	const cardAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
	const buttonScales = useRef<{ [key: string]: Animated.Value }>({}).current;

	useEffect(() => {
		if (user?.id) {
			loadUserPreferences();
		}
	}, [user?.id]);

	useEffect(() => {
		// Load meal type tags
		const filteredMealTypeTags = getTagsByType("meal_type");
		setMealTypeTags(filteredMealTypeTags);

		// Group other tags
		const groups: GroupedTags = {};
		tags.forEach((tag) => {
			if (tag.type === "goal" || tag.type === "meal_type") return;
			const type = tag.type;
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(tag);
		});
		setGroupedTags(groups);
	}, [tags, getTagsByType]);

	useEffect(() => {
		// Initialize goal animations
		AVAILABLE_GOALS.forEach((goal) => {
			if (!cardAnimations[goal.type]) {
				cardAnimations[goal.type] = new Animated.Value(1);
			}
			buttonScales[`${goal.type}-up`] = new Animated.Value(1);
			buttonScales[`${goal.type}-down`] = new Animated.Value(1);
		});
	}, [cardAnimations, buttonScales]);

	useEffect(() => {
		// Update ordered goals when userGoals changes
		if (userGoals && userGoals.length > 0) {
			const userOrderedGoals = userGoals
				.map((goalType) => AVAILABLE_GOALS.find((g) => g.type === goalType))
				.filter((goal): goal is GoalMetadata => goal !== undefined);
			setOrderedGoals(userOrderedGoals);
		} else {
			setOrderedGoals([...AVAILABLE_GOALS]);
		}
	}, [userGoals]);

	const loadUserPreferences = async () => {
		if (!user?.id) return;

		setIsLoading(true);
		try {
			// Fetch user preferences
			const { data: prefs } = await supabase
				.from("user_preferences")
				.select("*")
				.eq("user_id", user.id)
				.maybeSingle();

			if (prefs) {
				setMealsPerWeek(prefs.meals_per_week || 5);
				setServesPerMeal(prefs.serves_per_meal || 4);
				setUserGoals((prefs.user_goals || []) as UserGoal[]);
			}

			// Fetch user preference tags
			const { data: prefTags } = await supabase
				.from("user_preference_tags")
				.select("tag_id")
				.eq("user_id", user.id);

			if (prefTags) {
				setUserPreferenceTags(prefTags);
			}
		} catch (error) {
			console.error("Error loading preferences:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		if (!user?.id) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		setIsSaving(true);

		try {
			// Update user preferences
			const { error: prefsError } = await supabase
				.from("user_preferences")
				.upsert({
					user_id: user.id,
					meals_per_week: mealsPerWeek,
					serves_per_meal: servesPerMeal,
					user_goals: orderedGoals.map((g) => g.type),
				});

			if (prefsError) throw prefsError;

			// Delete existing preference tags
			await supabase
				.from("user_preference_tags")
				.delete()
				.eq("user_id", user.id);

			// Insert new preference tags
			if (userPreferenceTags.length > 0) {
				const tagsToInsert = userPreferenceTags.map((tag) => ({
					user_preference_id: user.id,
					tag_id: tag.tag_id,
				}));

				const { error: tagsError } = await supabase
					.from("user_preference_tags")
					.insert(tagsToInsert);

				if (tagsError) throw tagsError;
			}

			// Success
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.back();
		} catch (error) {
			console.error("Error saving preferences:", error);
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
		} finally {
			setIsSaving(false);
		}
	};

	// Counter handlers
	const handleIncrementMeals = () => {
		if (mealsPerWeek < 20) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setMealsPerWeek(mealsPerWeek + 1);
		}
	};

	const handleDecrementMeals = () => {
		if (mealsPerWeek > 1) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setMealsPerWeek(mealsPerWeek - 1);
		}
	};

	const handleIncrementServes = () => {
		if (servesPerMeal < 12) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setServesPerMeal(servesPerMeal + 1);
		}
	};

	const handleDecrementServes = () => {
		if (servesPerMeal > 1) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			setServesPerMeal(servesPerMeal - 1);
		}
	};

	// Goal ordering functions
	const animateButtonPress = (goalType: string, direction: "up" | "down") => {
		const scaleValue = buttonScales[`${goalType}-${direction}`];
		if (!scaleValue) return;

		Animated.sequence([
			Animated.timing(scaleValue, {
				toValue: 0.85,
				duration: 100,
				useNativeDriver: true,
			}),
			Animated.timing(scaleValue, {
				toValue: 1,
				duration: 100,
				useNativeDriver: true,
			}),
		]).start();
	};

	const animateCardSwap = (
		goalType1: string,
		goalType2: string,
		callback: () => void,
	) => {
		const anim1 = cardAnimations[goalType1];
		const anim2 = cardAnimations[goalType2];

		if (anim1 && anim2) {
			Animated.parallel([
				Animated.sequence([
					Animated.timing(anim1, {
						toValue: 1.02,
						duration: 150,
						useNativeDriver: true,
					}),
					Animated.timing(anim1, {
						toValue: 1,
						duration: 150,
						useNativeDriver: true,
					}),
				]),
				Animated.sequence([
					Animated.timing(anim2, {
						toValue: 1.02,
						duration: 150,
						useNativeDriver: true,
					}),
					Animated.timing(anim2, {
						toValue: 1,
						duration: 150,
						useNativeDriver: true,
					}),
				]),
			]).start();
		}

		LayoutAnimation.configureNext(
			{
				duration: 300,
				create: {
					type: LayoutAnimation.Types.spring,
					property: LayoutAnimation.Properties.opacity,
					springDamping: 0.7,
				},
				update: {
					type: LayoutAnimation.Types.spring,
					springDamping: 0.7,
				},
			},
			callback,
		);
	};

	const moveGoalUp = (index: number) => {
		if (index === 0) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		const currentGoal = orderedGoals[index];
		const previousGoal = orderedGoals[index - 1];

		animateButtonPress(currentGoal.type, "up");
		setAnimatingGoalIndex(index);

		animateCardSwap(currentGoal.type, previousGoal.type, () => {
			const newGoals = [...orderedGoals];
			[newGoals[index - 1], newGoals[index]] = [
				newGoals[index],
				newGoals[index - 1],
			];
			setOrderedGoals(newGoals);
			setTimeout(() => setAnimatingGoalIndex(null), 300);
		});
	};

	const moveGoalDown = (index: number) => {
		if (index === orderedGoals.length - 1) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		const currentGoal = orderedGoals[index];
		const nextGoal = orderedGoals[index + 1];

		animateButtonPress(currentGoal.type, "down");
		setAnimatingGoalIndex(index);

		animateCardSwap(currentGoal.type, nextGoal.type, () => {
			const newGoals = [...orderedGoals];
			[newGoals[index], newGoals[index + 1]] = [
				newGoals[index + 1],
				newGoals[index],
			];
			setOrderedGoals(newGoals);
			setTimeout(() => setAnimatingGoalIndex(null), 300);
		});
	};

	// Tag toggle functions
	const toggleMealType = (mealTypeTag: Tag) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const isCurrentlySelected = userPreferenceTags.some(
			(pref) => pref.tag_id === mealTypeTag.id,
		);

		if (isCurrentlySelected) {
			setUserPreferenceTags(
				userPreferenceTags.filter((pref) => pref.tag_id !== mealTypeTag.id),
			);
		} else {
			setUserPreferenceTags([...userPreferenceTags, { tag_id: mealTypeTag.id }]);
		}
	};

	const toggleTag = (tagId: string) => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		const existingTagIndex = userPreferenceTags.findIndex(
			(tag) => tag.tag_id === tagId,
		);

		if (existingTagIndex !== -1) {
			setUserPreferenceTags(
				userPreferenceTags.filter((tag) => tag.tag_id !== tagId),
			);
		} else {
			setUserPreferenceTags([...userPreferenceTags, { tag_id: tagId }]);
		}
	};

	const isTagSelected = (tagId: string): boolean => {
		return userPreferenceTags.some((pref) => pref.tag_id === tagId);
	};

	const getTypeDisplayName = (type: TagType | string): string => {
		const typeDisplayNames: Record<string, string> = {
			allergen: "Allergies & Intolerances",
			diet: "Dietary Preferences",
			budget: "Budget Preferences",
			time: "Cooking Time",
			macro: "Health / Macro Goals",
			cuisine: "Cuisines",
			skill_level: "Recipe Difficulty",
			method: "Cooking Methods",
			equipment: "Kitchen Equipment",
			seasonal: "Seasonal Preferences",
			occasion: "Occasions",
			category: "Categories",
			protein: "Protein Types",
		};

		return (
			typeDisplayNames[type] ||
			type
				.split("_")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ")
		);
	};

	const typeOrder: (TagType | string)[] = [
		"allergen",
		"diet",
		"budget",
		"time",
		"macro",
		"cuisine",
		"skill_level",
		"method",
		"equipment",
		"seasonal",
		"occasion",
		"category",
		"protein",
	];

	const getPriorityLabel = (idx: number): string => {
		switch (idx) {
			case 0:
				return "Top Priority";
			case 1:
				return "High Priority";
			case 2:
				return "Medium Priority";
			case 3:
				return "Low Priority";
			default:
				return "";
		}
	};

	const renderGoalItem = (goal: GoalMetadata, index: number) => {
		const isFirst = index === 0;
		const isLast = index === orderedGoals.length - 1;
		const isAnimating =
			animatingGoalIndex === index ||
			animatingGoalIndex === index - 1 ||
			animatingGoalIndex === index + 1;

		const cardScale = cardAnimations[goal.type] || new Animated.Value(1);
		const upButtonScale =
			buttonScales[`${goal.type}-up`] || new Animated.Value(1);
		const downButtonScale =
			buttonScales[`${goal.type}-down`] || new Animated.Value(1);

		return (
			<Animated.View
				key={goal.type}
				className="mb-3"
				style={{
					transform: [{ scale: cardScale }],
					opacity: isAnimating ? 0.95 : 1,
				}}
			>
				<View
					className="flex-row items-center bg-white/90 rounded-xl border-2 overflow-hidden"
					style={{
						borderColor: index === 0 ? "#25551b40" : "#25551b20",
						shadowColor: index === 0 ? "#25551b" : "#000",
						shadowOffset: {
							width: 0,
							height: index === 0 ? 2 : 1,
						},
						shadowOpacity: index === 0 ? 0.2 : 0.1,
						shadowRadius: index === 0 ? 4 : 2,
						elevation: index === 0 ? 4 : 2,
					}}
				>
					{/* Priority indicator bar */}
					<View
						className="w-1.5 h-full"
						style={{
							backgroundColor:
								goal.color +
								(index === 0
									? "FF"
									: index === 1
										? "CC"
										: index === 2
											? "99"
											: "66"),
						}}
					/>

					{/* Goal content */}
					<View className="flex-row items-center justify-between flex-1 py-4 pl-4 pr-2">
						<View className="flex-row items-center flex-1">
							<View
								className="w-10 h-10 rounded-full items-center justify-center mr-3"
								style={{ backgroundColor: goal.color + "20" }}
							>
								<Ionicons name={goal.icon as any} size={24} color={goal.color} />
							</View>

							<View className="flex-1">
								<Text className="text-lg font-semibold text-primary">
									{goal.name}
								</Text>
								{index < 4 && (
									<Text className="text-md text-primary/60 mt-0.5 font-medium">
										{getPriorityLabel(index)}
									</Text>
								)}
							</View>
						</View>

						{/* Arrow control buttons */}
						<View className="flex-row items-center gap-1">
							<Animated.View style={{ transform: [{ scale: upButtonScale }] }}>
								<Pressable
									onPress={() => moveGoalUp(index)}
									onPressIn={() =>
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									}
									disabled={isFirst || animatingGoalIndex !== null}
									className={`rounded-lg items-center justify-center ${
										isFirst ? "bg-gray-100" : "bg-primary/10"
									}`}
									style={{
										width: 40,
										height: 40,
									}}
								>
									<Ionicons
										name="arrow-up"
										size={20}
										color={isFirst ? "#00000020" : "#25551b"}
									/>
								</Pressable>
							</Animated.View>

							<Animated.View style={{ transform: [{ scale: downButtonScale }] }}>
								<Pressable
									onPress={() => moveGoalDown(index)}
									onPressIn={() =>
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									}
									disabled={isLast || animatingGoalIndex !== null}
									className={`rounded-lg items-center justify-center ${
										isLast ? "bg-gray-100" : "bg-primary/10"
									}`}
									style={{
										width: 40,
										height: 40,
									}}
								>
									<Ionicons
										name="arrow-down"
										size={20}
										color={isLast ? "#00000020" : "#25551b"}
									/>
								</Pressable>
							</Animated.View>
						</View>
					</View>
				</View>
			</Animated.View>
		);
	};

	if (isLoading) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<ActivityIndicator size="large" color="#25551b" />
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			{/* Header */}
			<View
				style={{
					backgroundColor: "#FFFFFF",
					borderBottomWidth: 2,
					borderBottomColor: "#EBEBEB",
				}}
				className="pt-16 pb-4 px-4"
			>
				<View className="flex-row items-center justify-between">
					<Pressable
						onPress={() => router.back()}
						onPressIn={() =>
							Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
						}
						className="w-10 h-10 items-center justify-center"
					>
						<Ionicons name="arrow-back" size={24} color="#25551b" />
					</Pressable>
					<Text className="text-xl font-montserrat-bold text-gray-800 uppercase tracking-wide">
						Edit Preferences
					</Text>
					<View className="w-10" />
				</View>
			</View>

			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
			>
				{/* Planning Section */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl p-6 mb-4"
				>
					<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider mb-4">
						Planning
					</Text>

					{/* Meals per week counter */}
					<View className="mb-4">
						<Text className="text-sm font-montserrat-semibold text-gray-700 mb-3">
							Meals per week
						</Text>
						<View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
							<Text className="text-3xl font-montserrat-bold text-gray-800">
								{mealsPerWeek}
							</Text>
							<View className="flex-row items-center gap-3">
								<Pressable
									onPress={handleDecrementMeals}
									onPressIn={() =>
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									}
									disabled={mealsPerWeek <= 1}
									className={`h-12 w-12 rounded-full items-center justify-center ${
										mealsPerWeek <= 1
											? "bg-gray-100 border border-gray-200"
											: "bg-white border-2 border-primary"
									}`}
								>
									<Ionicons
										name="remove"
										size={24}
										color={mealsPerWeek <= 1 ? "#9CA3AF" : "#25551B"}
									/>
								</Pressable>

								<Pressable
									onPress={handleIncrementMeals}
									onPressIn={() =>
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									}
									disabled={mealsPerWeek >= 20}
									className={`h-12 w-12 rounded-full items-center justify-center ${
										mealsPerWeek >= 20
											? "bg-gray-100 border border-gray-200"
											: "bg-primary border-2 border-primary"
									}`}
								>
									<Ionicons
										name="add"
										size={24}
										color={mealsPerWeek >= 20 ? "#9CA3AF" : "#fff"}
									/>
								</Pressable>
							</View>
						</View>
					</View>

					{/* Serves per meal counter */}
					<View>
						<Text className="text-sm font-montserrat-semibold text-gray-700 mb-3">
							Serves per meal
						</Text>
						<View className="flex-row items-center justify-between bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
							<Text className="text-3xl font-montserrat-bold text-gray-800">
								{servesPerMeal}
							</Text>
							<View className="flex-row items-center gap-3">
								<Pressable
									onPress={handleDecrementServes}
									onPressIn={() =>
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									}
									disabled={servesPerMeal <= 1}
									className={`h-12 w-12 rounded-full items-center justify-center ${
										servesPerMeal <= 1
											? "bg-gray-100 border border-gray-200"
											: "bg-white border-2 border-primary"
									}`}
								>
									<Ionicons
										name="remove"
										size={24}
										color={servesPerMeal <= 1 ? "#9CA3AF" : "#25551B"}
									/>
								</Pressable>

								<Pressable
									onPress={handleIncrementServes}
									onPressIn={() =>
										Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
									}
									disabled={servesPerMeal >= 12}
									className={`h-12 w-12 rounded-full items-center justify-center ${
										servesPerMeal >= 12
											? "bg-gray-100 border border-gray-200"
											: "bg-primary border-2 border-primary"
									}`}
								>
									<Ionicons
										name="add"
										size={24}
										color={servesPerMeal >= 12 ? "#9CA3AF" : "#fff"}
									/>
								</Pressable>
							</View>
						</View>
					</View>
				</View>

				{/* Goals Section */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl p-6 mb-4"
				>
					<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider mb-2">
						Goals
					</Text>
					<Text className="text-sm font-montserrat-medium text-gray-600 mb-4">
						Order your priorities to get personalized recommendations
					</Text>

					<View className="gap-2">
						{orderedGoals.map((goal, index) => renderGoalItem(goal, index))}
					</View>
				</View>

				{/* Meal Types Section */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl p-6 mb-4"
				>
					<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider mb-2">
						Meal Types
					</Text>
					<Text className="text-sm font-montserrat-medium text-gray-600 mb-4">
						What type of meals fit your household?
					</Text>

					<View className="gap-3">
						{mealTypeTags.map((mealTypeTag) => (
							<Pressable
								key={mealTypeTag.id}
								onPress={() => toggleMealType(mealTypeTag)}
								onPressIn={() =>
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
								}
								className={`w-full p-4 rounded-xl border-2 ${
									isTagSelected(mealTypeTag.id)
										? "bg-primary/10 border-primary"
										: "bg-white/90 border-primary/20"
								}`}
							>
								<View className="flex-row items-center justify-between">
									<Text
										className={`text-lg font-montserrat-semibold ${
											isTagSelected(mealTypeTag.id)
												? "text-primary"
												: "text-primary/80"
										}`}
									>
										{mealTypeTag.name}
									</Text>

									{isTagSelected(mealTypeTag.id) && (
										<View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
											<Ionicons name="checkmark" size={16} color="#fff" />
										</View>
									)}
								</View>
							</Pressable>
						))}
					</View>
				</View>

				{/* Dietary Preferences Section */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl p-6 mb-4"
				>
					<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider mb-2">
						Dietary Preferences
					</Text>
					<Text className="text-sm font-montserrat-medium text-gray-600 mb-4">
						Tell us your preferences to find perfect recipes
					</Text>

					<View className="gap-6">
						{typeOrder.map(
							(type) =>
								groupedTags[type] &&
								groupedTags[type].length > 0 && (
									<View key={type}>
										<Text className="text-sm font-montserrat-semibold text-gray-700 mb-3">
											{getTypeDisplayName(type)}
										</Text>

										<View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
											<View className="flex-row flex-wrap -m-1">
												{groupedTags[type].map((tag) => {
													const isSelected = isTagSelected(tag.id);

													return (
														<Pressable
															key={tag.id}
															onPress={() => toggleTag(tag.id)}
															onPressIn={() =>
																Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
															}
															className={`px-3 py-2 m-1 rounded-full border ${
																isSelected
																	? "bg-primary border-primary"
																	: "bg-white border-primary/30"
															}`}
														>
															<View className="flex-row items-center">
																<Text
																	className={`font-montserrat-semibold text-sm ${
																		isSelected ? "text-white" : "text-primary"
																	}`}
																>
																	{tag.name}
																</Text>

																{isSelected && (
																	<Ionicons
																		name="checkmark"
																		size={14}
																		color="#fff"
																		style={{ marginLeft: 4 }}
																	/>
																)}
															</View>
														</Pressable>
													);
												})}
											</View>
										</View>
									</View>
								),
						)}
					</View>
				</View>

				{/* Save Button */}
				<Button
					onPress={handleSave}
					onPressIn={() =>
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
					}
					disabled={isSaving}
					className="mb-8"
				>
					<View className="flex-row items-center justify-center gap-2">
						{isSaving ? (
							<ActivityIndicator size="small" color="#25551b" />
						) : (
							<Ionicons name="checkmark" size={20} color="#25551b" />
						)}
						<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
							{isSaving ? "Saving..." : "Save Preferences"}
						</Text>
					</View>
				</Button>
			</ScrollView>
		</View>
	);
}