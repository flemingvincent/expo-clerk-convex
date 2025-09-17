import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	ActivityIndicator,
	View,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
} from "react-native";
import * as z from "zod";
import Svg, { Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormInput } from "@/components/ui/form";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import { useRouter } from "expo-router";
import { usePressAnimation } from "@/hooks/onPressAnimation";

const formSchema = z
	.object({
		email: z.string().email("Please enter a valid email address."),
		password: z
			.string()
			.min(8, "Please enter at least 8 characters.")
			.max(64, "Please enter fewer than 64 characters.")
			.regex(
				/^(?=.*[a-z])/,
				"Your password must have at least one lowercase letter.",
			)
			.regex(
				/^(?=.*[A-Z])/,
				"Your password must have at least one uppercase letter.",
			)
			.regex(/^(?=.*[0-9])/, "Your password must have at least one number.")
			.regex(
				/^(?=.*[!@#$%^&*])/,
				"Your password must have at least one special character.",
			),
		confirmPassword: z.string().min(8, "Please enter at least 8 characters."),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Your passwords do not match.",
		path: ["confirmPassword"],
	});

export const SignUp = () => {
	const { signUp } = useAuth();
	const router = useRouter();

	const buttonPress = usePressAnimation({
		hapticStyle: "Medium",
		pressDistance: 4,
	});

	const linkPress = usePressAnimation({
		hapticStyle: "Light",
		pressDistance: 2,
	});

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await signUp(data.email, data.password);
			form.reset();
		} catch (error: Error | any) {
			console.error(error.message);
		}
	}

	const handleBackPress = () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		router.replace("/welcome");
	};

	return (
		<SafeAreaView className="flex-1 bg-lightgreen" edges={["top", "bottom"]}>
			{/* Back arrow */}
			<View className="flex-row justify-start p-4 pt-2">
				<TouchableOpacity
					onPress={handleBackPress}
					className="p-2 -ml-2"
					hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					accessibilityRole="button"
					accessibilityLabel="Go back"
					accessibilityHint="Navigate back to welcome screen"
				>
					<Ionicons name="arrow-back" size={24} color="#25551b" />
				</TouchableOpacity>
			</View>

			{/* Form container styled same as sign-in page */}
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
			>
				{/* Main content */}
				<View className="flex-1 items-center justify-center px-4 -mt-16">
					{/* Title using SVG text with same styling as sign-in page */}
					<Svg width="300" height="100" style={{ marginBottom: 20 }}>
						<SvgText
							x="150"
							y="60"
							textAnchor="middle"
							fill="#25551b"
							stroke="#E2F380"
							strokeWidth="0"
							letterSpacing="2"
							fontFamily="MMDisplay"
							fontSize="42"
							fontWeight="bold"
						>
							SIGN UP
						</SvgText>
					</Svg>

					<View className="w-full bg-background/80 rounded-2xl p-6 shadow-md">
						<Form {...form}>
							<View className="gap-4">
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormInput
											label="Email"
											placeholder="your@email.com"
											autoCapitalize="none"
											autoComplete="email"
											autoCorrect={false}
											keyboardType="email-address"
											textContentType="emailAddress"
											accessibilityLabel="Email address"
											accessibilityHint="Enter your email address to create an account"
											{...field}
										/>
									)}
								/>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormInput
											label="Password"
											placeholder="••••••••"
											autoCapitalize="none"
											autoCorrect={false}
											secureTextEntry
											autoComplete="new-password"
											textContentType="newPassword"
											accessibilityLabel="Password"
											accessibilityHint="Create a password with at least 8 characters"
											{...field}
										/>
									)}
								/>
								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormInput
											label="Confirm Password"
											placeholder="Confirm password"
											autoCapitalize="none"
											autoCorrect={false}
											secureTextEntry
											autoComplete="new-password"
											textContentType="newPassword"
											accessibilityLabel="Confirm password"
											accessibilityHint="Re-enter your password to confirm"
											{...field}
										/>
									)}
								/>

								{/* Password requirements hint */}
								<Text className="text-xs text-primary/70 mt-1">
									Password must contain at least 8 characters, including
									uppercase, lowercase, number, and special character.
								</Text>
							</View>
						</Form>

						{/* Sign up button with arrow */}
						<Button
							size="lg"
							variant="default"
							onPress={form.handleSubmit(onSubmit)}
							disabled={form.formState.isSubmitting}
							className="mt-6"
							accessibilityRole="button"
							accessibilityLabel="Sign up"
							accessibilityHint="Create your account with the provided information"
							accessibilityState={{
								disabled: form.formState.isSubmitting,
								busy: form.formState.isSubmitting,
							}}
							{...buttonPress}
						>
							{form.formState.isSubmitting ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<View className="flex-row items-center">
									<Text className="text-primary">Sign Up</Text>
									<Ionicons
										name="arrow-forward"
										size={16}
										color="#25551b"
										style={{ marginLeft: 8 }}
									/>
								</View>
							)}
						</Button>
					</View>

					{/* "Already have an account" section - Using router.replace instead of Link */}
					<View className="flex-row mt-6">
						<Text className="text-primary">Already have an account? </Text>
						<TouchableOpacity
							{...linkPress}
							onPress={() => router.replace("/sign-in")}
							accessibilityRole="button"
							accessibilityLabel="Sign in"
							accessibilityHint="Navigate to sign in page if you already have an account"
						>
							<Text className="text-primary font-bold">Sign In</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
