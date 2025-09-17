import {
	View,
	TouchableOpacity,
	Animated,
	Dimensions,
	Easing,
	Alert,
} from "react-native";
import { SafeAreaView } from "@/components/safe-area-view";
import { router } from "expo-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/context/supabase-provider";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Text as SvgText } from "react-native-svg";
import { Image } from "@/components/image";
import { Text } from "@/components/ui/text";

import { ProfileUpdate } from "@/types/database";
import { FormData } from "@/constants/onboarding";
import GoalsStep from "@/components/onboarding/GoalsStep";
import DetailsStep from "@/components/onboarding/DetailsStep";
import PlanningStep from "@/components/onboarding/PlanningStep";
import PreferencesStep from "@/components/onboarding/PreferencesStep";
import MealTypesStep from "@/components/onboarding/MealType";
import { useUserPreferences } from "@/context/user-preferences-provider";
import { useReferenceData } from "@/context/reference-data-provider";

const { width, height } = Dimensions.get("window");

const SuccessAnimation = ({
	visible,
	onComplete,
}: {
	visible: boolean;
	onComplete: () => void;
}) => {
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const scaleAnim = useRef(new Animated.Value(0.9)).current;
	const progressAnim = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const titleOpacity = useRef(new Animated.Value(0)).current;
	const titleTranslateY = useRef(new Animated.Value(-10)).current;

	const [loadingText, setLoadingText] = useState(
		"Analyzing your preferences...",
	);

	const animationStarted = useRef(false);
	const onCompleteRef = useRef(onComplete);
	const hasCompleted = useRef(false);

	const appIcon = require("@/assets/mm-homie-transparent-bg.png");

	const loadingMessages = [
		"Analyzing your preferences...",
		"Curating the perfect meal-kit for you...",
		"Personalizing your experience...",
		"Setting up your profile...",
	];

	useEffect(() => {
		onCompleteRef.current = onComplete;
	}, [onComplete]);

	useEffect(() => {
		if (visible && !animationStarted.current) {
			animationStarted.current = true;

			Animated.sequence([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.parallel([
					Animated.timing(titleOpacity, {
						toValue: 1,
						duration: 400,
						useNativeDriver: true,
					}),
					Animated.timing(titleTranslateY, {
						toValue: 0,
						duration: 400,
						useNativeDriver: true,
					}),
				]),
			]).start();

			Animated.timing(progressAnim, {
				toValue: 100,
				duration: 4000,
				easing: Easing.bezier(0.25, 0.1, 0.25, 1),
				useNativeDriver: false,
			}).start(() => {
				setTimeout(() => {
					if (!hasCompleted.current) {
						hasCompleted.current = true;
						onCompleteRef.current();
					}
				}, 500);
			});

			const textInterval = setInterval(() => {
				setLoadingText((prev) => {
					const currentIndex = loadingMessages.indexOf(prev);
					const nextIndex = (currentIndex + 1) % loadingMessages.length;
					return loadingMessages[nextIndex];
				});
			}, 1200);

			return () => {
				clearInterval(textInterval);
			};
		}
	}, [
		visible,
		fadeAnim,
		scaleAnim,
		progressAnim,
		contentTranslateY,
		titleOpacity,
		titleTranslateY,
	]);

	if (!visible) return null;

	return (
		<Animated.View
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width,
				height,
				backgroundColor: "#CCEA1F",
				opacity: fadeAnim,
				zIndex: 1000,
			}}
		>
			<SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
				<View
					style={{
						flex: 1,
						justifyContent: "center",
						alignItems: "center",
						paddingHorizontal: 16,
					}}
				>
					<Animated.View
						style={{
							opacity: titleOpacity,
							transform: [{ translateY: titleTranslateY }],
						}}
						className="items-center mb-12"
					>
						<Svg width="380" height="80">
							<SvgText
								x="190"
								y="60"
								textAnchor="middle"
								fill="#25551b"
								stroke="#E2F380"
								strokeWidth="0"
								letterSpacing="3"
								fontFamily="MMDisplay"
								fontSize="42"
								fontWeight="bold"
							>
								MEALMATE
							</SvgText>
						</Svg>
					</Animated.View>

					<Animated.View
						style={{
							transform: [
								{ scale: scaleAnim },
								{ translateY: contentTranslateY },
							],
						}}
						className="w-full bg-background/80 rounded-2xl p-8 shadow-md mb-8 items-center"
					>
						<Image
							source={appIcon}
							className="w-32 h-32 mx-auto mb-4"
							contentFit="contain"
						/>

						<View className="w-full mb-6">
							<View
								style={{
									height: 12,
									backgroundColor: "rgba(37, 85, 27, 0.2)",
									borderRadius: 6,
									overflow: "hidden",
									borderWidth: 2,
									borderColor: "#25551B",
									width: "100%",
								}}
							>
								<Animated.View
									style={{
										height: "100%",
										backgroundColor: "#FF6B6B",
										borderRadius: 4,
										width: progressAnim.interpolate({
											inputRange: [0, 100],
											outputRange: ["0%", "100%"],
										}),
										shadowColor: "#FF6B6B",
										shadowOffset: { width: 0, height: 0 },
										shadowOpacity: 0.6,
										shadowRadius: 4,
										elevation: 3,
									}}
								/>
							</View>
						</View>

						<Animated.View
							style={{
								opacity: fadeAnim,
								transform: [
									{
										translateY: fadeAnim.interpolate({
											inputRange: [0, 1],
											outputRange: [10, 0],
										}),
									},
								],
							}}
						>
							<Text className="text-primary text-lg font-montserrat-medium text-center">
								{loadingText}
							</Text>
						</Animated.View>
					</Animated.View>
				</View>
			</SafeAreaView>
		</Animated.View>
	);
};

const OnboardingScreen = () => {
	const { session, profile, updateProfile } = useAuth();
	const {
		preferences: userPreferences,
		refreshPreferences,
		updatePreferences,
	} = useUserPreferences();
	const { tags } = useReferenceData();
	const [currentStep, setCurrentStep] = useState(0);
	const [isLoading, setIsLoading] = useState(false);
	const [showSuccess, setShowSuccess] = useState(false);

	const stepOpacity = useRef(new Animated.Value(1)).current;

	const [formData, setFormData] = useState<FormData>({
		name: profile?.display_name || "",
		country: profile?.country || "",
		city: profile?.city || "",
		postcode: profile?.post_code || 0,
		mealsPerWeek: userPreferences?.meals_per_week || 4, // Use default 4
		servesPerMeal: userPreferences?.serves_per_meal || 2, // Use default 2
		userGoals: userPreferences?.user_goals || [],
		userPreferenceTags: userPreferences?.user_preference_tags || [],
	});

	// Updated steps array without Welcome
	const steps = [
		"Details",
		"Planning",
		"Goals",
		"Meal Types",
		"Dietary Preferences",
	];

	const handleFormChange = useCallback((field: keyof FormData, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	}, []);

	// Simplified step transition with just a subtle fade
	const transitionToStep = useCallback(
		(newStep: number) => {
			if (newStep === currentStep) return;

			Animated.timing(stepOpacity, {
				toValue: 0,
				duration: 150,
				useNativeDriver: true,
			}).start(() => {
				setCurrentStep(newStep);
				Animated.timing(stepOpacity, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}).start();
			});
		},
		[currentStep, stepOpacity],
	);

	const completeOnboarding = async () => {
		try {
			setIsLoading(true);
			setShowSuccess(true);

			const profileUpdates: Partial<ProfileUpdate> = {
				display_name: formData.name || null,
				country: formData.country || null,
				city: formData.city || null,
				post_code: formData.postcode || null,
				onboarding_completed: true,
			};

			await updateProfile(profileUpdates);

			await updatePreferences({
				meals_per_week: formData.mealsPerWeek,
				serves_per_meal: formData.servesPerMeal,
				user_goals: formData.userGoals,
				user_preference_tags: formData.userPreferenceTags,
			});

			await refreshPreferences();
		} catch (error) {
			console.error("Error completing onboarding:", error);
			setShowSuccess(false);
			Alert.alert(
				"Error",
				"There was an error saving your preferences. Please try again.",
				[{ text: "OK", onPress: () => router.replace("/") }],
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSuccessComplete = () => {
		setShowSuccess(false);
		// Navigate directly to home screen
		router.replace("/");
	};

	const handleNext = () => {
		if (currentStep === steps.length - 1) {
			// Last step (Dietary Preferences) - complete onboarding
			completeOnboarding();
		} else {
			transitionToStep(currentStep + 1);
		}
	};

	const handlePrevious = () => {
		if (currentStep > 0) {
			transitionToStep(currentStep - 1);
		}
	};

	const handleSkipStep = () => {
		if (currentStep < steps.length - 1) {
			// Can't skip the last step
			transitionToStep(currentStep + 1);
		}
	};

	const progressWidth = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const targetProgress = ((currentStep + 1) / steps.length) * 100;

		Animated.timing(progressWidth, {
			toValue: targetProgress,
			duration: 500,
			easing: Easing.bezier(0.25, 0.1, 0.25, 1),
			useNativeDriver: false,
		}).start();
	}, [currentStep, progressWidth, steps.length]);

	const handleExit = () => {
		Alert.alert(
			"Cancel Changes?",
			"Are you sure you want to exit? Any unsaved changes will be lost.",
			[
				{
					text: "Exit",
					style: "destructive",
					onPress: () => {
						router.back();
					},
				},
				{
					text: "Stay",
					style: "cancel",
				},
			],
			{ cancelable: true },
		);
	};

	const ProgressIndicator = () => {
		const isEditMode = profile?.onboarding_completed === true;

		return (
			<View className="mt-16">
				<View className="flex-row justify-between items-center">
					<View className="flex-row gap-2">
						{currentStep > 0 && (
							<TouchableOpacity
								onPress={handlePrevious}
								className="flex-row items-center bg-white/40 rounded-full px-4 py-2"
								style={{
									shadowColor: "#25551b",
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.1,
									shadowRadius: 2,
									elevation: 2,
								}}
							>
								<Ionicons name="chevron-back" size={18} color="#25551b" />
								<Text className="text-primary text-sm ml-1 font-medium">
									Back
								</Text>
							</TouchableOpacity>
						)}

						{isEditMode && (
							<TouchableOpacity
								onPress={handleExit}
								className="flex-row items-center bg-red-100/80 rounded-full px-4 py-2"
								style={{
									shadowColor: "#25551b",
									shadowOffset: { width: 0, height: 1 },
									shadowOpacity: 0.1,
									shadowRadius: 2,
									elevation: 2,
								}}
							>
								<Ionicons name="close" size={18} color="#dc2626" />
								<Text className="text-red-600 text-sm ml-1 font-medium">
									Cancel
								</Text>
							</TouchableOpacity>
						)}
					</View>

					{currentStep < steps.length - 1 && (
						<TouchableOpacity
							onPress={handleSkipStep}
							className="flex-row items-center bg-white/40 rounded-full px-4 py-2"
							style={{
								shadowColor: "#25551b",
								shadowOffset: { width: 0, height: 1 },
								shadowOpacity: 0.1,
								shadowRadius: 2,
								elevation: 2,
							}}
						>
							<Text className="text-primary text-sm mr-1 font-medium">
								Skip
							</Text>
							<Ionicons name="chevron-forward" size={18} color="#25551b" />
						</TouchableOpacity>
					)}
				</View>

				<View className="relative mt-4">
					<View
						className="h-3 rounded-full bg-background/80"
						style={{
							borderWidth: 2,
							borderColor: "#25551b",
						}}
					/>

					<Animated.View
						className="absolute top-0 h-3 rounded-full"
						style={{
							width: progressWidth.interpolate({
								inputRange: [0, 100],
								outputRange: ["0%", "100%"],
							}),
							backgroundColor: "#FF6B6B",
							borderWidth: 2,
							borderColor: "#25551b",
							shadowOffset: { width: 0, height: 0 },
							shadowOpacity: 0.6,
							shadowRadius: 4,
							elevation: 3,
						}}
					/>
				</View>
			</View>
		);
	};

	const getStepComponent = (stepIndex: number) => {
		switch (stepIndex) {
			case 0:
				return (
					<DetailsStep
						formData={formData}
						handleFormChange={handleFormChange}
						onNext={handleNext}
						isLoading={isLoading}
					/>
				);
			case 1:
				return (
					<PlanningStep
						formData={formData}
						handleFormChange={handleFormChange}
						onNext={handleNext}
						isLoading={isLoading}
					/>
				);
			case 2:
				return (
					<GoalsStep
						formData={formData}
						handleFormChange={handleFormChange}
						onNext={handleNext}
						isLoading={isLoading}
					/>
				);
			case 3:
				return (
					<MealTypesStep
						formData={formData}
						handleFormChange={handleFormChange}
						onNext={handleNext}
						isLoading={isLoading}
					/>
				);
			case 4:
				return (
					<PreferencesStep
						formData={formData}
						handleFormChange={handleFormChange}
						onNext={handleNext}
						isLoading={isLoading}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<>
			{!showSuccess && (
				<SafeAreaView style={{ flex: 1 }}>
					<View
						className="flex-grow bg-lightgreen"
						style={{ backgroundColor: "#CCEA1F" }}
					>
						<View className="px-4">
							<ProgressIndicator />
						</View>

						{/* Single animated container for current step */}
						<Animated.View
							style={{
								flex: 1,
								opacity: stepOpacity,
							}}
						>
							{getStepComponent(currentStep)}
						</Animated.View>
					</View>
				</SafeAreaView>
			)}

			<SuccessAnimation
				visible={showSuccess}
				onComplete={handleSuccessComplete}
			/>
		</>
	);
}

export default OnboardingScreen;