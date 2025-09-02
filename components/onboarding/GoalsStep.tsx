// components/onboarding/GoalsStep.tsx
import React, { useState, useEffect, useRef } from "react";
import {
	View,
	TouchableOpacity,
	ScrollView,
	Animated,
	LayoutAnimation,
	UIManager,
	Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Text as SvgText } from "react-native-svg";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/safe-area-view";
import { usePressAnimation } from "@/hooks/onPressAnimation";
import * as Haptics from "expo-haptics";
import { FormData, GoalMetadata, AVAILABLE_GOALS, UserGoal } from "@/constants/onboarding";

// Enable LayoutAnimation on Android
if (
	Platform.OS === "android" &&
	UIManager.setLayoutAnimationEnabledExperimental
) {
	UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GoalsStepProps {
	formData: FormData;
	handleFormChange: (field: keyof FormData, value: any) => void;
	onNext: () => void;
	isLoading: boolean;
}

const GoalsStep: React.FC<GoalsStepProps> = ({
	formData,
	handleFormChange,
	onNext,
	isLoading,
}) => {
	const [orderedGoals, setOrderedGoals] = useState<GoalMetadata[]>([]);
	const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
	const [hasUserInteracted, setHasUserInteracted] = useState(false);

	// Animation setup
	const contentOpacity = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const buttonOpacity = useRef(new Animated.Value(0)).current;
	const buttonTranslateY = useRef(new Animated.Value(20)).current;

	// Animation values for each card
	const cardAnimations = useRef<{ [key: string]: Animated.Value }>({}).current;
	const buttonScales = useRef<{ [key: string]: Animated.Value }>({}).current;

	// Press animation for button
	const buttonPress = usePressAnimation({
		hapticStyle: "Medium",
		pressDistance: 4,
	});

	useEffect(() => {
		// Content entrance animation
		const contentTimer = setTimeout(() => {
			Animated.parallel([
				Animated.timing(contentOpacity, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
				Animated.timing(contentTranslateY, {
					toValue: 0,
					duration: 400,
					useNativeDriver: true,
				}),
			]).start();
		}, 100);

		// Button entrance animation
		const buttonTimer = setTimeout(() => {
			Animated.parallel([
				Animated.timing(buttonOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.timing(buttonTranslateY, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start();
		}, 300);

		return () => {
			clearTimeout(contentTimer);
			clearTimeout(buttonTimer);
		};
	}, [contentOpacity, contentTranslateY, buttonOpacity, buttonTranslateY]);

	useEffect(() => {
		// Check if user already has goals set
		if (formData.userGoals && formData.userGoals.length > 0) {
			// Map the user's goals to GoalMetadata objects in the saved order
			const userOrderedGoals = formData.userGoals
				.map((goalType) => AVAILABLE_GOALS.find((g) => g.type === goalType))
				.filter((goal): goal is GoalMetadata => goal !== undefined);

			setOrderedGoals(userOrderedGoals);
			setHasUserInteracted(true);
		} else {
			// Set default order
			setOrderedGoals([...AVAILABLE_GOALS]);
		}

		// Initialize animation values
		AVAILABLE_GOALS.forEach((goal) => {
			if (!cardAnimations[goal.type]) {
				cardAnimations[goal.type] = new Animated.Value(1);
			}
			buttonScales[`${goal.type}-up`] = new Animated.Value(1);
			buttonScales[`${goal.type}-down`] = new Animated.Value(1);
		});
	}, [formData.userGoals, cardAnimations, buttonScales]);

	const animateButtonPress = (goalType: string, direction: "up" | "down") => {
		const scaleValue = buttonScales[`${goalType}-${direction}`];

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
		setAnimatingIndex(index);
		setHasUserInteracted(true);

		animateCardSwap(currentGoal.type, previousGoal.type, () => {
			const newGoals = [...orderedGoals];
			[newGoals[index - 1], newGoals[index]] = [
				newGoals[index],
				newGoals[index - 1],
			];
			setOrderedGoals(newGoals);
			setTimeout(() => setAnimatingIndex(null), 300);
		});
	};

	const moveGoalDown = (index: number) => {
		if (index === orderedGoals.length - 1) return;

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

		const currentGoal = orderedGoals[index];
		const nextGoal = orderedGoals[index + 1];

		animateButtonPress(currentGoal.type, "down");
		setAnimatingIndex(index);
		setHasUserInteracted(true);

		animateCardSwap(currentGoal.type, nextGoal.type, () => {
			const newGoals = [...orderedGoals];
			[newGoals[index], newGoals[index + 1]] = [
				newGoals[index + 1],
				newGoals[index],
			];
			setOrderedGoals(newGoals);
			setTimeout(() => setAnimatingIndex(null), 300);
		});
	};

	const handleContinue = () => {
		// Save the ordered goals as an array of goal types
		const goalTypes: UserGoal[] = orderedGoals.map((g) => g.type);
		handleFormChange("userGoals", goalTypes);
		onNext();
	};

	const renderGoalItem = (goal: GoalMetadata, index: number) => {
		const isFirst = index === 0;
		const isLast = index === orderedGoals.length - 1;
		const isAnimating =
			animatingIndex === index ||
			animatingIndex === index - 1 ||
			animatingIndex === index + 1;

		const cardScale = cardAnimations[goal.type] || new Animated.Value(1);
		const upButtonScale =
			buttonScales[`${goal.type}-up`] || new Animated.Value(1);
		const downButtonScale =
			buttonScales[`${goal.type}-down`] || new Animated.Value(1);

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
					{/* Priority indicator bar with goal color */}
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
							{/* Goal icon with color */}
							<View
								className="w-10 h-10 rounded-full items-center justify-center mr-3"
								style={{ backgroundColor: goal.color + "20" }}
							>
								<Ionicons
									name={goal.icon as any}
									size={24}
									color={goal.color}
								/>
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
								<TouchableOpacity
									onPress={() => moveGoalUp(index)}
									disabled={isFirst || animatingIndex !== null}
									className={`rounded-lg items-center justify-center ${
										isFirst ? "bg-gray-100" : "bg-primary/10"
									}`}
									style={{
										width: 40,
										height: 40,
									}}
									accessibilityRole="button"
									accessibilityLabel={`Move ${goal.name} up`}
									accessibilityHint="Increases the priority of this goal"
								>
									<Ionicons
										name="arrow-up"
										size={20}
										color={isFirst ? "#00000020" : "#25551b"}
									/>
								</TouchableOpacity>
							</Animated.View>

							<Animated.View
								style={{ transform: [{ scale: downButtonScale }] }}
							>
								<TouchableOpacity
									onPress={() => moveGoalDown(index)}
									disabled={isLast || animatingIndex !== null}
									className={`rounded-lg items-center justify-center ${
										isLast ? "bg-gray-100" : "bg-primary/10"
									}`}
									style={{
										width: 40,
										height: 40,
									}}
									accessibilityRole="button"
									accessibilityLabel={`Move ${goal.name} down`}
									accessibilityHint="Decreases the priority of this goal"
								>
									<Ionicons
										name="arrow-down"
										size={20}
										color={isLast ? "#00000020" : "#25551b"}
									/>
								</TouchableOpacity>
							</Animated.View>
						</View>
					</View>
				</View>
			</Animated.View>
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-lightgreen" edges={["top"]}>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
			>
				{/* Animated Title Section */}
				<Animated.View
					style={{
						opacity: contentOpacity,
						transform: [{ translateY: contentTranslateY }],
					}}
					className="items-center mt-8 mb-8"
				>
					<Svg width="280" height="60">
						<SvgText
							x="140"
							y="50"
							textAnchor="middle"
							fill="#25551b"
							stroke="#E2F380"
							strokeWidth="0"
							letterSpacing="2"
							fontFamily="MMDisplay"
							fontSize="36"
							fontWeight="bold"
						>
							GOALS
						</SvgText>
					</Svg>
					<Text className="text-primary text-lg text-center px-4">
						What matters most to you?
					</Text>
					<Text className="text-primary/60 text-sm text-center px-4 mt-1">
						Order your priorities to get personalized recommendations
					</Text>
				</Animated.View>

				{/* Form Container */}
				<Animated.View
					style={{
						opacity: contentOpacity,
						transform: [{ translateY: contentTranslateY }],
					}}
					className="w-full bg-background/80 rounded-2xl p-6 shadow-md"
				>
					<View className="gap-2">
						{/* Instructions */}
						<View className="flex-row items-center mb-4 px-1">
							<Ionicons name="swap-vertical" size={20} color="#25551b60" />
							<Text className="text-primary/60 text-sm ml-2 flex-1">
								Drag to reorder based on what's most important to you
							</Text>
						</View>

						{/* Goal List */}
						<View>
							{orderedGoals.map((goal, index) => renderGoalItem(goal, index))}
						</View>

						{/* Continue Button */}
						<Animated.View
							style={{
								opacity: buttonOpacity,
								transform: [{ translateY: buttonTranslateY }],
							}}
							className="mt-6"
						>
							<Button
								size="lg"
								variant="default"
								onPress={handleContinue}
								disabled={isLoading || animatingIndex !== null}
								className="w-full"
								accessibilityRole="button"
								accessibilityLabel="Continue to next step"
								accessibilityHint="Proceed to the meal types step of onboarding"
								accessibilityState={{
									disabled: isLoading,
									busy: isLoading,
								}}
								{...buttonPress}
							>
								<View className="flex-row items-center justify-center">
									<Text className="text-primary text-xl mr-2 font-semibold">
										{isLoading ? "Saving..." : "Continue"}
									</Text>
									<Ionicons name="arrow-forward" size={20} color="#25551b" />
								</View>
							</Button>
						</Animated.View>
					</View>
				</Animated.View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default GoalsStep;
