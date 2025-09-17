import { View, ScrollView, Pressable } from "react-native";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { MealCard } from "./MealCard";
import { MealPlanItem } from "@/types/database";
import { useMealPlan } from "@/context/meal-plan-provider";
import { useWeeks } from "@/context/week-data-provider";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/supabase-provider";
import React from "react";

export const MealPlanSection = () => {
	const router = useRouter();

	const {
		currentMealPlan,
		loading: mealPlanLoading,
		error: mealPlanError,
		loadMealPlanForWeek,
		regenerateMealPlan,
		dependenciesReady,
	} = useMealPlan();

	const { weeks, currentWeek, getWeekById, getWeeksRange } = useWeeks();
	const { profile } = useAuth();
	const userName = profile?.display_name ?? "there";

	const loading = mealPlanLoading;
	const error = mealPlanError;

	const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
	const [isLoadingWeekPlan, setIsLoadingWeekPlan] = useState(false);
	const [isTransitioningWeek, setIsTransitioningWeek] = useState(false);

	useEffect(() => {
		if (currentWeek && !selectedWeekId) {
			setSelectedWeekId(currentWeek.id);
		}
	}, [currentWeek]);

	useEffect(() => {
		if (!selectedWeekId || !dependenciesReady) {
			return;
		}

		(async () => {
			setIsLoadingWeekPlan(true);
			try {
				await loadMealPlanForWeek(selectedWeekId);
			} catch (error) {
				console.error("Error loading meal plan:", error);
			} finally {
				setIsLoadingWeekPlan(false);
				setIsTransitioningWeek(false);
			}
		})();
	}, [selectedWeekId, dependenciesReady]);

	const displayWeeks = useMemo(() => {
		return getWeeksRange(-1, 3);
	}, [weeks, getWeeksRange]);

	const handleMealPress = (meal: MealPlanItem) => {
		console.log("pressed meal:", meal.recipe.name);
		router.push(`/recipe/${meal.recipe.id}`);
	};

	const handleWeekPress = useCallback(
		(weekId: string) => {
			if (weekId === selectedWeekId) return;
			setSelectedWeekId(weekId);
		},
		[selectedWeekId],
	);

	const handlePreviousWeekClick = () => {
		const currentIndex = displayWeeks.findIndex(
			(week) => week.id === selectedWeekId,
		);
		if (currentIndex > 0) {
			const previousWeek = displayWeeks[currentIndex - 1];
			setIsTransitioningWeek(true);
			handleWeekPress(previousWeek.id);
		}
	};

	const handleNextWeekClick = () => {
		const currentIndex = displayWeeks.findIndex(
			(week) => week.id === selectedWeekId,
		);
		if (currentIndex < displayWeeks.length - 1) {
			const nextWeek = displayWeeks[currentIndex + 1];
			setIsTransitioningWeek(true);
			handleWeekPress(nextWeek.id);
		}
	};

	const handleEditMeals = () => {
		const selectedWeek = getWeekById(selectedWeekId!);
		if (!selectedWeek) return;
        
		router.push({
			pathname: "/meal-planner",
			params: {
				weekId: selectedWeek.id,
				weekStart: selectedWeek.start_date,
				weekEnd: selectedWeek.end_date,
				displayRange: selectedWeek.display_range,
			},
		});
	};

	const handleGenerateNewPlan = async () => {
		try {
			if (selectedWeekId) {
				await regenerateMealPlan(selectedWeekId);
			}
		} catch (error) {
			console.error("Error generating new meal plan:", error);
		}
	};

	const displayMeals = currentMealPlan;
	const selectedWeek = selectedWeekId ? getWeekById(selectedWeekId) : null;

	const StickyCalendarSection = useMemo(() => {
		const currentIndex = displayWeeks.findIndex(
			(week) => week.id === selectedWeekId,
		);
		const hasPrevious = currentIndex > 0;
		const hasNext = currentIndex < displayWeeks.length - 1;

		const getStepStates = () => {
			if (!selectedWeek)
				return {
					plan: "inactive",
					shop: "inactive",
					review: "inactive",
				} as const;

			if (selectedWeek.is_current_week) {
				return {
					plan: "complete",
					shop: "active",
					review: "inactive",
				} as const;
			} else if (selectedWeek.weekOffset === -1) {
				return {
					plan: "complete",
					shop: "complete",
					review: "active",
				} as const;
			} else if (selectedWeek.weekOffset >= 1) {
				return {
					plan: "active",
					shop: "inactive",
					review: "inactive",
				} as const;
			}

			return {
				plan: "inactive",
				shop: "inactive",
				review: "inactive",
			} as const;
		};

		const stepStates = getStepStates();

		const renderStep = (
			stepName: string,
			iconName: string,
			state: "complete" | "active" | "inactive",
		) => {
			const isComplete = state === "complete";
			const isActive = state === "active";

			return (
				<View className="items-center">
					<View
						style={{
							width: isActive ? 32 : 28,
							height: isActive ? 32 : 28,
							borderRadius: isActive ? 8 : 7,
							borderWidth: 2,
							borderColor: isComplete || isActive ? "#25551b" : "#EBEBEB",
							backgroundColor: isActive
								? "#CCEA1F"
								: isComplete
									? "#25551b"
									: "#FFFFFF",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						{isComplete ? (
							<Ionicons
								name="checkmark-sharp"
								size={isActive ? 16 : 14}
								color="#FFFFFF"
							/>
						) : (
							<Ionicons
								name={iconName as any}
								size={isActive ? 16 : 14}
								color={isActive ? "#25551b" : "#9CA3AF"}
							/>
						)}
					</View>
					<Text
						className={`text-xs mt-1 ${isComplete || isActive ? "font-montserrat-bold" : "font-montserrat-semibold"} uppercase`}
						style={{ color: isComplete || isActive ? "#25551b" : "#9CA3AF" }}
					>
						{stepName}
					</Text>
				</View>
			);
		};

		return (
			<View
				className="pb-3"
				style={{
					backgroundColor: "#FFFFFF",
					borderBottomWidth: 2,
					borderBottomColor: "#EBEBEB",
					position: "absolute",
					top: 0,
					left: 0,
					right: 0,
					zIndex: 10,
				}}
			>
				<View className="flex-row items-center justify-between px-4">
					<Pressable
                        onPress={handlePreviousWeekClick}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={!hasPrevious || isTransitioningWeek}
                        style={{
                            opacity: (!hasPrevious || isTransitioningWeek) ? 0.3 : 1,
                        }}
                        onPressIn={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}}
                    >
                        <Ionicons name="chevron-back" size={24} color="#1f2937" />
                    </Pressable>


					<View className="flex-row items-center">
						<Text className="text-xl text-gray-800 uppercase tracking-wide font-montserrat-bold">
							{selectedWeek?.displayTitle}
						</Text>
					</View>

					<Pressable
						onPress={handleNextWeekClick}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						disabled={!hasNext || isTransitioningWeek}
                        style={{
                            opacity: (!hasNext || isTransitioningWeek) ? 0.3 : 1,
                        }}
                        onPressIn={() => {Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}}
					>
						<Ionicons name="chevron-forward" size={24} color="#1f2937" />
					</Pressable>
				</View>

				<View className="flex-row justify-center items-center px-12 pt-3">
					{isTransitioningWeek ? (
						<View className="flex-1 flex-row justify-between items-center opacity-50">
							{renderStep("Plan", "calendar-outline", stepStates.plan)}
							<View
								style={{
									height: 3,
									backgroundColor: "#EBEBEB",
									flex: 1,
									marginHorizontal: 8,
									marginTop: -12,
									borderRadius: 2,
								}}
							/>
							{renderStep("Shop", "cart-outline", stepStates.shop)}
							<View
								style={{
									height: 3,
									backgroundColor: "#EBEBEB",
									flex: 1,
									marginHorizontal: 8,
									marginTop: -12,
									borderRadius: 2,
								}}
							/>
							{renderStep("Review", "star-outline", stepStates.review)}
						</View>
					) : (
						<View className="flex-1 flex-row justify-between items-center">
							{renderStep("Plan", "calendar-outline", stepStates.plan)}
							<View
								style={{
									height: 3,
									backgroundColor:
										stepStates.plan === "complete" ? "#25551b" : "#EBEBEB",
									flex: 1,
									marginHorizontal: 8,
									marginTop: -12,
									borderRadius: 2,
								}}
							/>
							{renderStep("Shop", "cart-outline", stepStates.shop)}
							<View
								style={{
									height: 3,
									backgroundColor:
										stepStates.shop === "complete" ? "#25551b" : "#EBEBEB",
									flex: 1,
									marginHorizontal: 8,
									marginTop: -12,
									borderRadius: 2,
								}}
							/>
							{renderStep("Review", "star-outline", stepStates.review)}
						</View>
					)}
				</View>
			</View>
		);
	}, [
		displayWeeks,
		selectedWeekId,
		selectedWeek,
		handlePreviousWeekClick,
		handleNextWeekClick,
		isTransitioningWeek,
	]);

	if ((!dependenciesReady || loading) && !isLoadingWeekPlan) {
		return (
			<View className="flex-1">
				{StickyCalendarSection}

				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingTop: 110 }}
				>
					<View className="px-6 pb-4">
						<Text className="text-2xl font-montserrat-bold text-gray-800">
							Hi {userName}!
						</Text>
						<Text className="text-lg font-montserrat-semibold text-gray-500">
							Loading your personalized meal plan...
						</Text>
					</View>

					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{ paddingHorizontal: 16, paddingRight: 32 }}
					>
						{[0, 1, 2].map((index) => {
							const defaultColors = [
								{ text: "#F88675", background: "#FFE5E1" },
								{ text: "#FFB524", background: "#FFF2D6" },
								{ text: "#54CDC3", background: "#E8F9F7" },
							];
							const colors = defaultColors[index];

							return (
								<View
									key={index}
									style={{
										backgroundColor: colors.background,
										borderColor: colors.text,
										width: 280,
									}}
									className="mr-4 border-2 rounded-2xl p-6 h-[380px] justify-center items-center"
								>
									<View
										style={{ backgroundColor: colors.text + "20" }}
										className="w-16 h-16 rounded-xl mb-4 items-center justify-center"
									>
										<Ionicons
											name="restaurant-outline"
											size={32}
											color={colors.text}
										/>
									</View>
									<Text
										style={{ color: colors.text }}
										className="font-montserrat-bold tracking-wide uppercase text-center"
									>
										LOADING MEAL
									</Text>
								</View>
							);
						})}
					</ScrollView>
				</ScrollView>
			</View>
		);
	}

	if (error) {
		return (
			<View className="flex-1">
				{StickyCalendarSection}

				<ScrollView
					className="flex-1"
					contentContainerStyle={{ paddingTop: 110 }}
				>
					<View className="px-6 pb-4">
						<Text className="text-2xl font-montserrat-bold text-gray-800">
							Hi {userName}!
						</Text>
						<Text className="text-lg font-montserrat-semibold text-gray-600">
							We couldn't load your meal plan.
						</Text>
					</View>

					<View className="px-4">
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
							<View className="p-6 items-center">
								<View
									style={{
										width: 64,
										height: 64,
										borderWidth: 2,
										borderColor: "#dc2626",
										backgroundColor: "#fef2f2",
									}}
									className="rounded-xl items-center justify-center mb-4"
								>
									<Ionicons name="alert-circle" size={28} color="#dc2626" />
								</View>

								<Text className="text-xl font-montserrat-bold text-gray-800 uppercase tracking-wide text-center mb-2">
									Something Went Wrong
								</Text>

								<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-6 px-4">
									{error?.message ||
										"We couldn't load your meals. Please try again."}
								</Text>

								<View className="w-full gap-3">
									<Button
										variant="default"
										onPress={handleGenerateNewPlan}
                                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
										className="w-full"
									>
										<View className="flex-row items-center gap-2">
											<Ionicons name="refresh" size={18} color="#25551b" />
											<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
												Try Again
											</Text>
										</View>
									</Button>

									<Button
										variant="outline"
										className="w-full border-2"
									>
										<Text className="font-montserrat-semibold uppercase tracking-wide">
											Browse Recipes Instead
										</Text>
									</Button>
								</View>
							</View>
						</View>
					</View>
				</ScrollView>
			</View>
		);
	}

	return (
		<View className="flex-1">
			{StickyCalendarSection}

			<ScrollView
				className="flex-1 bg-background"
				contentContainerStyle={{ paddingTop: 110, paddingBottom: 20 }}
				showsVerticalScrollIndicator={false}
			>
				<View className="px-6 pb-4">
					<View>
						<Text className="text-2xl font-montserrat-bold text-gray-800">
							Hi {userName}!
						</Text>
						<Text className="text-lg font-montserrat-semibold text-gray-800">
							{isTransitioningWeek ? (
								"Loading meals for " +
								selectedWeek?.displayTitle?.toLowerCase() +
								"..."
							) : (
								<>
									{(() => {
										if (!selectedWeek) {
											return "Loading your personalized meal plan...";
										}

										// Past week (review)
										if (selectedWeek.weekOffset === -1) {
											if (displayMeals.length > 0) {
												return "Please review your previous meals. Reviewing meals helps us better recommend meals for you in the future.";
											} else {
												return "No meals to review from last week.";
											}
										}

										// Current week
										if (selectedWeek.is_current_week) {
											if (displayMeals.length > 0) {
												return (
													<>
														We picked {displayMeals.length} meals that match
														your{" "}
														<Text
															className="text-xl font-montserrat-semibold text-gray-800 underline"
															onPress={() => router.push("/profile")}
														>
															preferences
														</Text>
														.
													</>
												);
											} else {
												return "Let's plan your meals for this week!";
											}
										}

										// Future weeks
										if (selectedWeek.weekOffset >= 1) {
											if (displayMeals.length > 0) {
												return `Planning ahead! We've selected ${displayMeals.length} meals for ${selectedWeek.displayTitle?.toLowerCase()}. You can adjust these anytime.`;
											} else {
												return `Ready to plan meals for ${selectedWeek.displayTitle?.toLowerCase()}? Generate a personalized meal plan when you're ready.`;
											}
										}

										return "Loading your meal plan...";
									})()}
								</>
							)}
						</Text>
					</View>
				</View>

				{isTransitioningWeek ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							paddingHorizontal: 16,
							paddingRight: 32,
							paddingBottom: 4,
						}}
						scrollEnabled={false}
					>
						{[0, 1, 2].map((index) => (
							<View
								key={`loading-${index}`}
								style={{
									width: 320,
									height: 380,
									backgroundColor: "#FFFFFF",
									borderWidth: 2,
									borderColor: "#EBEBEB",
									borderBottomWidth: 6,
									borderBottomColor: "#EBEBEB",
								}}
								className="mr-4 rounded-2xl overflow-hidden"
							>
								<View className="p-2">
									<View
										className="aspect-[4/3] w-full rounded-xl"
										style={{
											backgroundColor: "#F3F4F6",
										}}
									>
										<View className="flex-1 items-center justify-center">
											<View
												style={{
													width: 40,
													height: 40,
													borderRadius: 10,
													backgroundColor: "#E5E7EB",
												}}
											/>
										</View>
									</View>
								</View>

								<View className="flex-1 p-4">
									<View className="flex-row gap-2 mb-3">
										<View
											style={{
												width: 60,
												height: 24,
												borderRadius: 12,
												backgroundColor: "#F3F4F6",
											}}
										/>
									</View>
									<View>
										<View
											style={{
												width: "80%",
												height: 20,
												borderRadius: 4,
												backgroundColor: "#F3F4F6",
												marginBottom: 8,
											}}
										/>
										<View
											style={{
												width: "100%",
												height: 16,
												borderRadius: 4,
												backgroundColor: "#F9FAFB",
												marginBottom: 4,
											}}
										/>
										<View
											style={{
												width: "70%",
												height: 16,
												borderRadius: 4,
												backgroundColor: "#F9FAFB",
											}}
										/>
									</View>
								</View>
							</View>
						))}
					</ScrollView>
				) : displayMeals.length > 0 ? (
                    <View className="px-4 gap-2">
                        {displayMeals.map((meal: MealPlanItem, index: number) => (
                            <MealCard
                                key={meal.id}
                                recipe={meal}
                                isCollapsed={true}
                                onPress={() => handleMealPress(meal)}
                            />
                        ))}
                    </View>
				) : (
					<View className="px-4">
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
							<View className="p-6 items-center">
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
									<Ionicons name="restaurant" size={28} color="#25551b" />
								</View>

								<Text className="text-xl font-montserrat-bold text-gray-800 uppercase tracking-wide text-center mb-2">
									{selectedWeek?.is_current_week
										? "Ready to Plan"
										: `Plan for ${selectedWeek?.displayTitle}`}
								</Text>

								<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-6 px-4">
									{selectedWeek?.is_current_week
										? "Let's create your personalized meal plan for this week"
										: "Generate meals that match your taste preferences"}
								</Text>

								<View className="w-full gap-3">
									<Button
										variant="default"
										onPress={handleGenerateNewPlan}
                                        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
										className="w-full"
									>
										<View className="flex-row items-center gap-2">
											<Ionicons name="sparkles" size={18} color="#25551b" />
											<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
												Generate Meal Plan
											</Text>
										</View>
									</Button>

									<Button
										variant="outline"
										className="w-full border-2"
									>
										<Text className="font-montserrat-semibold uppercase tracking-wide">
											Browse Recipes
										</Text>
									</Button>
								</View>
							</View>
						</View>
					</View>
				)}

				{selectedWeek && displayMeals.length > 0 && !isTransitioningWeek && (
					<View className="px-4 flex-1 gap-4 mt-2">
						{selectedWeek.is_current_week && (
							<Button
                                onPress={() => router.push('/cart')}
                                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
								variant="default"
								accessibilityRole="button"
								accessibilityLabel="Add ingredients to cart"
								accessibilityHint="Add ingredients for the selected meals to your cart"
							>
								<Text>Checkout with grocer</Text>
							</Button>
						)}
                        
                        {selectedWeek.weekOffset >= 0 && (
                            <View className="flex-1">
                                <Button
                                    variant="outline"
                                    accessibilityRole="button"
                                    accessibilityLabel="Edit meals"
                                    accessibilityHint="Edit your meal plan and adjust servings"
                                    className="border-2"
                                    onPress={handleEditMeals}
                                    onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
                                >
                                    <Text className="uppercase">Change meals</Text>
                                </Button>
                            </View>
						)}

						{selectedWeek.weekOffset === -1 && (
							<Button
								variant="outline"
								accessibilityRole="button"
								accessibilityLabel="Review Meals"
								accessibilityHint="Review the meals you have selected for this week"
							>
								<Text>Review Meals</Text>
							</Button>
						)}
					</View>
				)}
			</ScrollView>
		</View>
	);
};
