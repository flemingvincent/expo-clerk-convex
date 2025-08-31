import { View, ScrollView, TouchableOpacity } from "react-native";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { MealCard } from "./MealCard";
import { usePressAnimation } from "@/hooks/onPressAnimation";
import { MealPlanItem } from "@/types/database";
import { useMealPlan } from "@/context/meal-plan-provider";
import { useWeeks } from "@/context/week-data-provider";
import * as Haptics from "expo-haptics";

export const MealPlanSection = () => {
	const router = useRouter();

	const {
		currentMealPlan,
		loading: mealPlanLoading,
		error: mealPlanError,
		updateMealServings,
		loadMealPlanForWeek,
		regenerateMealPlan,
		dependenciesReady,
	} = useMealPlan();

	const { weeks, currentWeek, getWeekById, getWeeksRange } = useWeeks();

	const loading = mealPlanLoading;
	const error = mealPlanError;

	const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
	const [isLoadingWeekPlan, setIsLoadingWeekPlan] = useState(false);

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
			}
		})();
	}, [selectedWeekId, dependenciesReady]);

	const displayWeeks = useMemo(() => {
		return getWeeksRange(-1, 3);
	}, [weeks, getWeeksRange]);

	const buttonPress = usePressAnimation({
		hapticStyle: "Medium",
		pressDistance: 4,
	});

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
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			const previousWeek = displayWeeks[currentIndex - 1];
			handleWeekPress(previousWeek.id);
		}
	};

	const handleNextWeekClick = () => {
		const currentIndex = displayWeeks.findIndex(
			(week) => week.id === selectedWeekId,
		);
		if (currentIndex < displayWeeks.length - 1) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			const nextWeek = displayWeeks[currentIndex + 1];
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
	const totalServings = displayMeals.reduce(
		(sum, meal) => sum + meal.servings,
		0,
	);

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
					<TouchableOpacity
						onPress={handlePreviousWeekClick}
						disabled={!hasPrevious}
						style={{
							opacity: hasPrevious ? 1 : 0.3,
						}}
						{...buttonPress}
					>
						<Ionicons name="chevron-back" size={24} color="#1f2937" />
					</TouchableOpacity>

					<Text className="text-xl text-gray-800 uppercase tracking-wide font-montserrat-bold">
						{selectedWeek?.displayTitle}
					</Text>

					<TouchableOpacity
						onPress={handleNextWeekClick}
						disabled={!hasNext}
						style={{
							opacity: hasNext ? 1 : 0.3,
						}}
						{...buttonPress}
					>
						<Ionicons name="chevron-forward" size={24} color="#1f2937" />
					</TouchableOpacity>
				</View>

				<View className="flex-row justify-center items-center px-12 pt-3">
					<View className="flex-1 flex-row justify-between items-center">
						{/* Plan Step */}
						{renderStep("Plan", "calendar-outline", stepStates.plan)}

						{/* Connector Line */}
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

						{/* Shop Step */}
						{renderStep("Shop", "cart-outline", stepStates.shop)}

						{/* Connector Line */}
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

						{/* Review Step */}
						{renderStep("Review", "star-outline", stepStates.review)}
					</View>
				</View>
			</View>
		);
	}, [
		displayWeeks,
		selectedWeekId,
		selectedWeek,
		handlePreviousWeekClick,
		handleNextWeekClick,
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
							Hi Patrick!
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
							Hi Patrick!
						</Text>
						<Text className="text-lg font-montserrat-semibold text-red-600">
							Something went wrong loading your meals.
						</Text>
					</View>

					<View
						style={{
							backgroundColor: "#FFE0D1",
							borderColor: "#FF6525",
						}}
						className="mx-4 mb-6 border-2 rounded-2xl p-6 items-center"
					>
						<View className="bg-[#FF6525] w-16 h-16 rounded-xl items-center justify-center mb-4">
							<Ionicons name="alert-circle" size={32} color="#FFF" />
						</View>

						<Text className="text-[#FF6525] text-xl font-montserrat-bold tracking-wide uppercase mb-2 text-center">
							Can't load your meal plan
						</Text>

						<Text className="text-[#FF6525]/80 text-center mb-4 font-montserrat-semibold">
							{error?.message || "Please try again"}
						</Text>

						<Button
							onPress={handleGenerateNewPlan}
							variant="outline"
							className="border-[#FF6525] bg-transparent"
							{...buttonPress}
						>
							<View className="flex-row items-center">
								<Ionicons
									name="sync"
									size={16}
									color="#FF6525"
									className="mr-2"
								/>
								<Text className="text-[#FF6525] font-montserrat-bold tracking-wide uppercase">
									Try Again
								</Text>
							</View>
						</Button>
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
							Hi Patrick!
						</Text>
						<Text className="text-lg font-montserrat-semibold text-gray-800">
							We picked {displayMeals.length} meals that match your{" "}
							<Text
								className="text-xl font-montserrat-semibold text-gray-800 underline"
								onPress={() => router.push("/profile")}
							>
								preferences
							</Text>
							.
						</Text>
					</View>
				</View>

				{displayMeals.length > 0 ? (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={{
							paddingHorizontal: 16,
							paddingRight: 32,
							paddingBottom: 4,
						}}
						decelerationRate="fast"
						snapToInterval={334}
						snapToAlignment="start"
					>
						{displayMeals.map((meal: MealPlanItem, index: number) => (
							<MealCard
								key={meal.id}
								recipe={meal}
								onPress={() => handleMealPress(meal)}
							/>
						))}
					</ScrollView>
				) : (
					<View
						style={{
							backgroundColor: "#EBF3E7",
							borderColor: "#6B8E23",
						}}
						className="mx-4 border-2 rounded-2xl p-6 items-center"
					>
						<View className="bg-[#6B8E23] w-16 h-16 rounded-xl items-center justify-center mb-4">
							<Ionicons name="calendar-outline" size={32} color="#FFF" />
						</View>
						<Text className="text-[#6B8E23] text-xl font-montserrat-bold tracking-wide uppercase mb-2 text-center">
							{selectedWeek?.is_current_week
								? "No meals planned"
								: `No meals this week`}
						</Text>
						<Text className="text-[#6B8E23]/80 text-center font-montserrat-semibold mb-4">
							{selectedWeek?.is_current_week
								? "Let's get you some personalized meal suggestions!"
								: "Generate meals that match your preferences"}
						</Text>

						<Button
							onPress={handleGenerateNewPlan}
							variant="outline"
							className="border-[#6B8E23] bg-transparent"
							{...buttonPress}
						>
							<Text className="text-[#6B8E23] font-montserrat-semibold">
								Generate Meal Plan
							</Text>
						</Button>
					</View>
				)}

				{selectedWeek && displayMeals.length > 0 && (
					<View className="px-4 flex-1 gap-4 mt-2">
						{selectedWeek.weekOffset >= 0 && (
							<View className="flex-row items-center justify-between gap-2">
								<View className="flex-1">
									<Button
										variant="outline"
										accessibilityRole="button"
										accessibilityLabel="Edit meals"
										accessibilityHint="Edit your meal plan and adjust servings"
										className="border-2"
										onPress={handleEditMeals}
										{...buttonPress}
									>
										<Text className="uppercase">Change meals</Text>
									</Button>
								</View>

								<Button
									variant="outline"
									accessibilityRole="button"
									accessibilityLabel="Regenerate meal plan"
									accessibilityHint="Generate a new meal plan for this week"
									className="border-2"
									onPress={handleGenerateNewPlan}
									{...buttonPress}
								>
									<View className="flex-row items-center">
										<Ionicons name="sync" size={24} color="#25551b" />
									</View>
								</Button>
							</View>
						)}

						{selectedWeek.is_current_week && (
							<Button
								variant="default"
								accessibilityRole="button"
								accessibilityLabel="Add ingredients to cart"
								accessibilityHint="Add ingredients for the selected meals to your cart"
								{...buttonPress}
							>
								<Text>Checkout with grocer</Text>
							</Button>
						)}

						{selectedWeek.weekOffset === -1 && (
							<Button
								variant="outline"
								accessibilityRole="button"
								accessibilityLabel="Review Meals"
								accessibilityHint="Review the meals you have selected for this week"
								{...buttonPress}
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
