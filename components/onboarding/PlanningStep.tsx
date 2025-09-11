// components/onboarding/PlanningStep.tsx
import React, { useRef, useEffect } from "react";
import { View, ScrollView, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Text as SvgText } from "react-native-svg";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/safe-area-view";
import { usePressAnimation } from "@/hooks/onPressAnimation";
import Counter from "./Counter";
import { FormData } from "@/constants/onboarding";

interface PlanningStepProps {
	formData: FormData;
	handleFormChange: (field: keyof FormData, value: any) => void;
	onNext: () => void;
	isLoading: boolean;
}

const PlanningStep: React.FC<PlanningStepProps> = ({
	formData,
	handleFormChange,
	onNext,
	isLoading,
}) => {
	// Animation setup similar to details screen
	const contentOpacity = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const buttonOpacity = useRef(new Animated.Value(0)).current;
	const buttonTranslateY = useRef(new Animated.Value(20)).current;

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

	const handleIncrementMeals = () => {
		if (formData.mealsPerWeek < 20) {
			handleFormChange("mealsPerWeek", formData.mealsPerWeek + 1);
		}
	};

	const handleDecrementMeals = () => {
		if (formData.mealsPerWeek > 1) {
			handleFormChange("mealsPerWeek", formData.mealsPerWeek - 1);
		}
	};

	const handleIncrementServes = () => {
		if (formData.servesPerMeal < 12) {
			handleFormChange("servesPerMeal", formData.servesPerMeal + 1);
		}
	};

	const handleDecrementServes = () => {
		if (formData.servesPerMeal > 1) {
			handleFormChange("servesPerMeal", formData.servesPerMeal - 1);
		}
	};

	// Constants for min/max values
	const MEALS_MIN = 1;
	const MEALS_MAX = 20;
	const SERVES_MIN = 1;
	const SERVES_MAX = 12;

	return (
		<SafeAreaView className="flex-1 bg-lightgreen" edges={["top", "bottom"]}>
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
					{/* SVG Title matching signup style */}
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
							fontSize="34"
							fontWeight="bold"
						>
							PLANNING
						</SvgText>
					</Svg>
					<Text className="text-primary text-lg text-center px-4">
						How often and how much are you cooking?
					</Text>
				</Animated.View>

				{/* Form Container matching signup style */}
				<Animated.View
					style={{
						opacity: contentOpacity,
						transform: [{ translateY: contentTranslateY }],
					}}
					className="w-full bg-background/80 rounded-2xl p-6 shadow-md"
				>
					<View className="gap-6">
						<Counter
							label="Meals per week"
							value={formData.mealsPerWeek}
							onIncrement={handleIncrementMeals}
							onDecrement={handleDecrementMeals}
							min={MEALS_MIN}
							max={MEALS_MAX}
						/>

						<Counter
							label="Serves per meal"
							value={formData.servesPerMeal}
							onIncrement={handleIncrementServes}
							onDecrement={handleDecrementServes}
							min={SERVES_MIN}
							max={SERVES_MAX}
						/>

						{/* Continue Button with animation and matching style */}
						<Animated.View
							style={{
								opacity: buttonOpacity,
								transform: [{ translateY: buttonTranslateY }],
							}}
							className="mt-4"
						>
							<Button
								size="lg"
								variant="default"
								onPress={onNext}
								disabled={isLoading}
								className="w-full"
								accessibilityRole="button"
								accessibilityLabel="Continue to next step"
								accessibilityHint="Proceed to the goals step of onboarding"
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

export default PlanningStep;