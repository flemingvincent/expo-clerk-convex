import { View, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAuth } from "@/context/supabase-provider";
import { router } from "expo-router";
import type { Tables } from "@/types/supabase";
import * as Haptics from "expo-haptics";
import { supabase } from "@/config/supabase";

type UserPreferences = Tables<"user_preferences">;
type Week = Tables<"weeks">;

interface WeekWithMealPlans extends Week {
	meal_count: number;
}

export default function Profile() {
	const { session, profile, signOut } = useAuth();
	const [userPreferences, setUserPreferences] =
		useState<UserPreferences | null>(null);
	const [recentWeeks, setRecentWeeks] = useState<WeekWithMealPlans[]>([]);
	const [savedRecipesCount, setSavedRecipesCount] = useState<number>(0);
	const [totalRatings, setTotalRatings] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(true);

	const user = session?.user;

	useEffect(() => {
		if (user?.id) {
			fetchUserData();
		}
	}, [user?.id]);

	const fetchUserData = async () => {
		if (!user?.id) return;

		setIsLoading(true);

		try {
			// Fetch user preferences
			const { data: prefs } = await supabase
				.from("user_preferences")
				.select("*")
				.eq("user_id", user.id)
				.maybeSingle();

			setUserPreferences(prefs);

			// Fetch recent weeks with meal plan counts
			const { data: mealPlans } = await supabase
				.from("user_meal_plans")
				.select("week_id, weeks(*)")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(50);

			if (mealPlans) {
				// Group by week and count meals
				const weekMap = new Map<string, WeekWithMealPlans>();
				mealPlans.forEach((mp: any) => {
					const week = mp.weeks;
					if (week && !weekMap.has(week.id)) {
						weekMap.set(week.id, { ...week, meal_count: 0 });
					}
					if (week) {
						const existingWeek = weekMap.get(week.id);
						if (existingWeek) {
							existingWeek.meal_count += 1;
						}
					}
				});

				const sortedWeeks = Array.from(weekMap.values())
					.sort(
						(a, b) =>
							new Date(b.start_date).getTime() -
							new Date(a.start_date).getTime(),
					)
					.slice(0, 5);

				setRecentWeeks(sortedWeeks);
			}

			// Count saved recipes
			const { count: savedCount } = await supabase
				.from("user_saved_recipes")
				.select("*", { count: "exact", head: true })
				.eq("user_id", user.id);

			setSavedRecipesCount(savedCount || 0);

			// Count recipe ratings
			const { count: ratingsCount } = await supabase
				.from("user_recipe_ratings")
				.select("*", { count: "exact", head: true })
				.eq("user_id", user.id);

			setTotalRatings(ratingsCount || 0);
		} catch (error) {
			console.error("Error fetching user data:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	const handleSignOut = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		await signOut();
	};

	if (isLoading) {
		return (
			<View className="flex-1 bg-background items-center justify-center">
				<View
					style={{
						backgroundColor: "#CCEA1F",
						borderWidth: 2,
						borderColor: "#25551b",
					}}
					className="w-20 h-20 rounded-xl items-center justify-center mb-6"
				>
					<Ionicons name="person" size={40} color="#25551b" />
				</View>
				<Text
					style={{ color: "#25551b" }}
					className="text-xl font-montserrat-bold tracking-wide uppercase"
				>
					LOADING PROFILE
				</Text>
			</View>
		);
	}

	return (
		<ScrollView className="flex-1 bg-background pt-16" showsVerticalScrollIndicator={false}>
			<View className="p-4 gap-y-4">
				{/* Profile Header */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl overflow-hidden p-6"
				>
					<View className="items-center">
						<View
							style={{
								backgroundColor: "#CCEA1F",
								borderWidth: 2,
								borderColor: "#25551b",
							}}
							className="w-20 h-20 rounded-xl items-center justify-center mb-4"
						>
							<Ionicons name="person" size={40} color="#25551b" />
						</View>
						<Text className="text-2xl font-montserrat-bold text-gray-800 uppercase tracking-wide">
							{profile?.display_name || "User"}
						</Text>
						<Text className="text-sm font-montserrat-medium text-gray-500 mt-1">
							{user?.email}
						</Text>
						<Text className="text-xs font-montserrat-medium text-gray-400 mt-1">
							Member since {user?.created_at ? formatDate(user.created_at) : "N/A"}
						</Text>
					</View>
				</View>

				{/* Quick Stats */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl overflow-hidden p-6"
				>
					<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider mb-4">
						Activity
					</Text>
					<View className="flex-row justify-around">
						<View className="items-center">
							<View
								style={{
									backgroundColor: "#F3F4F6",
									borderWidth: 2,
									borderColor: "#EBEBEB",
								}}
								className="w-16 h-16 rounded-xl items-center justify-center mb-2"
							>
								<Ionicons name="calendar-outline" size={28} color="#25551b" />
							</View>
							<Text className="text-2xl font-montserrat-bold text-gray-800">
								{recentWeeks.length}
							</Text>
							<Text className="text-xs font-montserrat-semibold text-gray-500 uppercase tracking-wide">
								Weeks
							</Text>
						</View>

						<View className="items-center">
							<View
								style={{
									backgroundColor: "#F3F4F6",
									borderWidth: 2,
									borderColor: "#EBEBEB",
								}}
								className="w-16 h-16 rounded-xl items-center justify-center mb-2"
							>
								<Ionicons name="heart-outline" size={28} color="#25551b" />
							</View>
							<Text className="text-2xl font-montserrat-bold text-gray-800">
								{savedRecipesCount}
							</Text>
							<Text className="text-xs font-montserrat-semibold text-gray-500 uppercase tracking-wide">
								Saved
							</Text>
						</View>

						<View className="items-center">
							<View
								style={{
									backgroundColor: "#F3F4F6",
									borderWidth: 2,
									borderColor: "#EBEBEB",
								}}
								className="w-16 h-16 rounded-xl items-center justify-center mb-2"
							>
								<Ionicons name="thumbs-up-outline" size={28} color="#25551b" />
							</View>
							<Text className="text-2xl font-montserrat-bold text-gray-800">
								{totalRatings}
							</Text>
							<Text className="text-xs font-montserrat-semibold text-gray-500 uppercase tracking-wide">
								Ratings
							</Text>
						</View>
					</View>
				</View>

				{/* Meal Preferences */}
				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl overflow-hidden p-6"
				>
					<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider mb-4">
						Preferences
					</Text>

					{userPreferences ? (
						<View className="gap-y-4">
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-3">
									<View
										style={{
											backgroundColor: "#F3F4F6",
											borderWidth: 2,
											borderColor: "#EBEBEB",
										}}
										className="w-10 h-10 rounded-lg items-center justify-center"
									>
										<Ionicons name="restaurant-outline" size={18} color="#25551b" />
									</View>
									<Text className="text-sm font-montserrat-semibold text-gray-700 uppercase tracking-wide">
										Meals / Week
									</Text>
								</View>
								<Text className="text-lg font-montserrat-bold text-gray-800">
									{userPreferences.meals_per_week || "-"}
								</Text>
							</View>

							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-3">
									<View
										style={{
											backgroundColor: "#F3F4F6",
											borderWidth: 2,
											borderColor: "#EBEBEB",
										}}
										className="w-10 h-10 rounded-lg items-center justify-center"
									>
										<Ionicons name="people-outline" size={18} color="#25551b" />
									</View>
									<Text className="text-sm font-montserrat-semibold text-gray-700 uppercase tracking-wide">
										Servings / Meal
									</Text>
								</View>
								<Text className="text-lg font-montserrat-bold text-gray-800">
									{userPreferences.serves_per_meal || "-"}
								</Text>
							</View>

							{userPreferences.user_goals &&
								userPreferences.user_goals.length > 0 && (
									<View className="flex-row items-center justify-between">
										<View className="flex-row items-center gap-3">
											<View
												style={{
													backgroundColor: "#F3F4F6",
													borderWidth: 2,
													borderColor: "#EBEBEB",
												}}
												className="w-10 h-10 rounded-lg items-center justify-center"
											>
												<Ionicons name="flag-outline" size={18} color="#25551b" />
											</View>
											<Text className="text-sm font-montserrat-semibold text-gray-700 uppercase tracking-wide">
												Goals
											</Text>
										</View>
										<Text className="text-lg font-montserrat-bold text-gray-800">
											{userPreferences.user_goals.length}
										</Text>
									</View>
								)}

							<Button
								variant="outline"
								onPress={() => router.push("/edit-preferences")}
								onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
								className="mt-2 border-2"
							>
								<Text className="font-montserrat-bold uppercase tracking-wide">
									Edit Preferences
								</Text>
							</Button>
						</View>
					) : (
						<View>
							<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-4">
								Set up your meal preferences to get personalized recommendations
							</Text>
							<Button
								onPress={() => router.push("/onboarding")}
								onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							>
								<Text className="text-[#25551b] font-montserrat-bold uppercase tracking-wide">
									Set Preferences
								</Text>
							</Button>
						</View>
					)}
				</View>

				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl overflow-hidden p-6"
				>
					<View className="flex-row justify-between items-center mb-4">
						<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider">
							Meal History
						</Text>
						{recentWeeks.length > 0 && (
							<Pressable
								// onPress={() => router.push("/meal-plan-history")}
								onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Text className="text-xs font-montserrat-bold text-[#25551b] uppercase tracking-wide">
									View All
								</Text>
							</Pressable>
						)}
					</View>

					{recentWeeks.length > 0 ? (
						<View className="gap-y-2">
							{recentWeeks.map((week, index) => (
								<Pressable
									key={week.id}
									// onPress={() => router.push(`/meal-planner/${week.id}`)}
									onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
								>
									{({ pressed }) => (
										<View
											style={{
												backgroundColor: "#F9FAFB",
												borderWidth: 2,
												borderColor: "#EBEBEB",
												borderBottomWidth: pressed ? 2 : 4,
												borderBottomColor: "#EBEBEB",
											}}
											className="rounded-xl p-4"
										>
											<View className="flex-row items-center justify-between">
												<View className="flex-1">
													<Text className="text-sm font-montserrat-bold text-gray-800 uppercase tracking-wide">
														{week.display_range}
													</Text>
													<Text className="text-xs font-montserrat-medium text-gray-500 mt-0.5">
														{week.meal_count} {week.meal_count === 1 ? "MEAL" : "MEALS"}
													</Text>
												</View>
												<Ionicons name="chevron-forward" size={20} color="#9ca3af" />
											</View>
										</View>
									)}
								</Pressable>
							))}
						</View>
					) : (
						<View>
							<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-4">
								You haven't created any meal plans yet
							</Text>
							<Button
								variant="outline"
								onPress={() => router.push("/meal-planner")}
								onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
								className="border-2"
							>
								<Text className="font-montserrat-bold uppercase tracking-wide">
									Create Plan
								</Text>
							</Button>
						</View>
					)}
				</View>

				{savedRecipesCount > 0 && (
					<Pressable
						onPress={() => router.push("/saved")}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
					>
						{({ pressed }) => (
							<View
								style={{
									backgroundColor: "#FFFFFF",
									borderWidth: 2,
									borderColor: "#EBEBEB",
									borderBottomWidth: pressed ? 2 : 6,
									borderBottomColor: "#EBEBEB",
								}}
								className="rounded-2xl overflow-hidden p-6"
							>
								<View className="flex-row items-center justify-between">
									<View className="flex-row items-center gap-3">
										<View
											style={{
												backgroundColor: "#CCEA1F",
												borderWidth: 2,
												borderColor: "#25551b",
											}}
											className="w-12 h-12 rounded-xl items-center justify-center"
										>
											<Ionicons name="heart" size={24} color="#25551b" />
										</View>
										<View>
											<Text className="text-base font-montserrat-bold text-gray-800 uppercase tracking-wider">
												Saved Recipes
											</Text>
											<Text className="text-xs font-montserrat-medium text-gray-500">
												View your {savedRecipesCount} favorite{savedRecipesCount !== 1 ? "s" : ""}
											</Text>
										</View>
									</View>
									<Ionicons name="chevron-forward" size={24} color="#9ca3af" />
								</View>
							</View>
						)}
					</Pressable>
				)}

				<View
					style={{
						backgroundColor: "#FFFFFF",
						borderWidth: 2,
						borderColor: "#EBEBEB",
						borderBottomWidth: 6,
						borderBottomColor: "#EBEBEB",
					}}
					className="rounded-2xl overflow-hidden p-6"
				>
					<Text className="text-sm font-montserrat-medium text-gray-600 text-center mb-4">
						Sign out and return to the welcome screen
					</Text>

					<Button
						className="w-full border-2"
						variant="destructive"
						onPress={handleSignOut}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
					>
						<View className="flex-row items-center justify-center gap-2">
							<Ionicons name="log-out-outline" size={18} color="white" />
							<Text className="font-montserrat-bold uppercase tracking-wide">
								Sign Out
							</Text>
						</View>
					</Button>
				</View>
			</View>
		</ScrollView>
	);
}