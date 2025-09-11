// components/onboarding/DetailsStep.tsx
import React, { useRef, useEffect } from "react";
import { View, ScrollView, Animated, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Text as SvgText } from "react-native-svg";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FormData } from "@/constants/onboarding";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { SafeAreaView } from "@/components/safe-area-view";
import { usePressAnimation } from "@/hooks/onPressAnimation";

// Define the form schema with validation
const formSchema = z.object({
	name: z.string()
		.min(1, "Please enter your name.")
		.max(50, "Name must be less than 50 characters."),
	country: z.string()
		.min(1, "Please enter your country.")
		.max(50, "Country must be less than 50 characters."),
	city: z.string()
		.min(1, "Please enter your city.")
		.max(50, "City must be less than 50 characters."),
	postcode: z.string()
		.min(1, "Please enter your postcode.")
		.max(10, "Postcode must be less than 10 characters.")
		.regex(/^\d+$/, "Postcode must contain only numbers."),
});

// Infer the form data type from the schema
type DetailsFormData = z.infer<typeof formSchema>;

interface DetailsStepProps {
	formData: FormData;
	handleFormChange: (field: keyof FormData, value: any) => void;
	onNext: () => void;
	isLoading: boolean;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
	formData,
	handleFormChange,
	onNext,
	isLoading,
}) => {
	// Animation setup similar to welcome screen
	const contentOpacity = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const buttonOpacity = useRef(new Animated.Value(0)).current;
	const buttonTranslateY = useRef(new Animated.Value(20)).current;

	// Press animation for button
	const buttonPress = usePressAnimation({
		hapticStyle: 'Medium',
		pressDistance: 4,
	});

	const form = useForm<DetailsFormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: formData.name || "",
			country: formData.country || "",
			city: formData.city || "",
			postcode: formData.postcode !== 0 ? formData.postcode.toString() : "",
		},
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

	const onSubmit = async (data: DetailsFormData) => {
		try {
			// Update form data with validated values
			handleFormChange("name", data.name);
			handleFormChange("country", data.country);
			handleFormChange("city", data.city);
			handleFormChange("postcode", parseInt(data.postcode, 10) || 0);
			
			// Proceed to next step
			onNext();
		} catch (error) {
			console.error("Error submitting details:", error instanceof Error ? error.message : error);
		}
	};

	return (
		<KeyboardAvoidingView
			className="flex-1"
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 100}
		>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ 
					flexGrow: 1, 
					paddingHorizontal: 16,
					paddingBottom: 20
				}}
			>
				{/* Animated Title Section */}
				<Animated.View
					style={{
						opacity: contentOpacity,
						transform: [{ translateY: contentTranslateY }],
					}}
					className="items-center mt-4 mb-6"
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
							DETAILS
						</SvgText>
					</Svg>
					<Text className="text-primary text-lg text-center px-4">
						Tell us a bit about yourself
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
					<Form {...form}>
						<View className="gap-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormInput
										label="Name"
										placeholder="Enter your name"
										autoCapitalize="words"
										autoComplete="name"
										autoCorrect={false}
										textContentType="name"
										returnKeyType="next"
										accessibilityLabel="Name"
										accessibilityHint="Enter your full name"
										{...field}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="country"
								render={({ field }) => (
									<FormInput
										label="Country"
										placeholder="Enter your country"
										autoCapitalize="words"
										autoComplete="country"
										autoCorrect={false}
										textContentType="countryName"
										returnKeyType="next"
										accessibilityLabel="Country"
										accessibilityHint="Enter the country you live in"
										{...field}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormInput
										label="City"
										placeholder="Enter your city"
										autoCapitalize="words"
										autoCorrect={false}
										textContentType="addressCity"
										returnKeyType="next"
										accessibilityLabel="City"
										accessibilityHint="Enter the city you live in"
										{...field}
									/>
								)}
							/>
							<FormField
								control={form.control}
								name="postcode"
								render={({ field }) => (
									<FormInput
										label="Postcode"
										placeholder="Enter your postcode"
										keyboardType="number-pad"
										autoCapitalize="characters"
										autoComplete="postal-code"
										autoCorrect={false}
										textContentType="postalCode"
										returnKeyType="done"
										accessibilityLabel="Postcode"
										accessibilityHint="Enter your postal or zip code"
										{...field}
									/>
								)}
							/>
						</View>
					</Form>

					{/* Continue Button with animation and matching style */}
					<Animated.View
						style={{
							opacity: buttonOpacity,
							transform: [{ translateY: buttonTranslateY }]
						}}
						className="mt-6"
					>
						<Button
							size="lg"
							variant="default"
							onPress={form.handleSubmit(onSubmit)}
							disabled={form.formState.isSubmitting || isLoading}
							className="w-full"
							accessibilityRole="button"
							accessibilityLabel="Continue to next step"
							accessibilityHint="Proceed to the planning step of onboarding"
							accessibilityState={{ 
								disabled: form.formState.isSubmitting || isLoading,
								busy: form.formState.isSubmitting || isLoading
							}}
							{...buttonPress}
						>
							{form.formState.isSubmitting || isLoading ? (
								<ActivityIndicator size="small" color="#25551b" />
							) : (
								<View className="flex-row items-center justify-center">
									<Text className="text-primary text-xl mr-2 font-semibold">
										Continue
									</Text>
									<Ionicons
										name="arrow-forward"
										size={20}
										color="#25551b"
									/>
								</View>
							)}
						</Button>
					</Animated.View>
				</Animated.View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
};

export default DetailsStep;