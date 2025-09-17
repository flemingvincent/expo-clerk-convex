import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
	ActivityIndicator,
	View,
	TouchableOpacity,
	Animated,
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

const formSchema = z.object({
	email: z.string().email("Please enter a valid email address."),
	password: z
		.string()
		.min(8, "Please enter at least 8 characters.")
		.max(64, "Please enter fewer than 64 characters."),
});

export const SignIn = () => {
	const { signIn } = useAuth();
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
		},
	});

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			await signIn(data.email, data.password);
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

			{/* Main content */}
			<KeyboardAvoidingView
				className="flex-1"
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
			>
				<View className="flex-1 items-center justify-center px-4 -mt-16">
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
							SIGN IN
						</SvgText>
					</Svg>

					{/* Form container styled similar to welcome page */}
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
											accessibilityHint="Enter your email address to sign in"
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
											autoComplete="password"
											textContentType="password"
											accessibilityLabel="password"
											accessibilityHint="Enter your password to sign in"
											{...field}
										/>
									)}
								/>
							</View>
						</Form>

						{/* Sign in button styled like welcome page buttons */}
						<Animated.View>
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
									<View className="text-primary flex-row items-center">
										<Text className="text-primary">Sign In</Text>
										<Ionicons
											name="arrow-forward"
											size={16}
											color="#25551b"
											style={{ marginLeft: 8 }}
										/>
									</View>
								)}
							</Button>
						</Animated.View>
					</View>

					{/* "Don't have an account" section - Using router.replace instead of Link */}
					<View className="flex-row mt-6">
						<Text className="text-primary">Don't have an account? </Text>
						<TouchableOpacity
							{...linkPress}
							onPress={() => router.replace("/sign-up")}
							accessibilityRole="button"
							accessibilityLabel="Sign in"
							accessibilityHint="Navigate to sign in page if you already have an account"
						>
							<Text className="text-primary font-bold">Sign Up</Text>
						</TouchableOpacity>
					</View>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
