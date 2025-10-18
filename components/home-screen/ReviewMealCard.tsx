// ReviewMealCard.tsx

import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import { Image } from "@/components/image";
import * as Haptics from "expo-haptics";
import { MealPlanItem } from "@/types/database";
import { useEffect, useState } from "react";
import Svg, { Path } from "react-native-svg";
import { useUserPreferences } from "@/context/user-preferences-provider";

interface ReviewMealCardProps {
	recipe: MealPlanItem;
	onPress?: () => void;
}

const ThumbsUpIcon = ({ color, filled }: { color: string; filled: boolean }) => (
	<Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
		<Path
			d="M7 22V11M2 13V20C2 21.1046 2.89543 22 4 22H16.4262C17.907 22 19.1662 20.9197 19.3914 19.4562L20.4683 12.4562C20.7479 10.6389 19.3418 9 17.5032 9H14C13.4477 9 13 8.55228 13 8V4.46584C13 3.10399 11.896 2 10.5342 2C10.2093 2 9.91498 2.1913 9.78306 2.48812L7.26394 8.40614C7.09895 8.76727 6.74463 9 6.35738 9H4C2.89543 9 2 9.89543 2 11V13Z"
			stroke={color}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			fill={filled ? color : "none"}
		/>
	</Svg>
);

const ThumbsDownIcon = ({ color, filled }: { color: string; filled: boolean }) => (
	<Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
		<Path
			d="M17 2V13M22 11V4C22 2.89543 21.1046 2 20 2H7.57377C6.09297 2 4.83379 3.08027 4.60864 4.54377L3.53168 11.5438C3.25208 13.3611 4.65821 15 6.49678 15H10C10.5523 15 11 15.4477 11 16V19.5342C11 20.896 12.104 22 13.4658 22C13.7907 22 14.085 21.8087 14.2169 21.5119L16.7361 15.5939C16.9011 15.2327 17.2554 15 17.6426 15H20C21.1046 15 22 14.1046 22 13V11Z"
			stroke={color}
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			fill={filled ? color : "none"}
		/>
	</Svg>
);

export const ReviewMealCard = ({
	recipe,
	onPress,
}: ReviewMealCardProps) => {
	const { isSaved, toggleSaveRecipe, getRating, setRating, removeRating } = useUserPreferences();
	
	const isRecipeSaved = isSaved(recipe.recipe.id);
	const existingRating = getRating(recipe.recipe.id);
	
	// Initialize local state from existing rating
	const [rating, setLocalRating] = useState<'up' | 'down' | null>(
		existingRating === null ? null : existingRating ? 'up' : 'down'
	);

	// Update local state if existing rating changes
	useEffect(() => {
		setLocalRating(existingRating === null ? null : existingRating ? 'up' : 'down');
	}, [existingRating]);

	const handlePress = () => {
		if (onPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
			onPress();
		}
	};

	const handleThumbsUp = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		
		try {
			if (rating === 'up') {
				// Remove rating if already thumbs up
				setLocalRating(null);
				await removeRating(recipe.recipe.id);
			} else {
				// Set thumbs up
				setLocalRating('up');
				await setRating(recipe.recipe.id, true);
			}
		} catch (error) {
			console.error("Error updating rating:", error);
			// Revert local state on error
			setLocalRating(existingRating === null ? null : existingRating ? 'up' : 'down');
		}
	};

	const handleThumbsDown = async () => {
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		
		try {
			if (rating === 'down') {
				// Remove rating if already thumbs down
				setLocalRating(null);
				await removeRating(recipe.recipe.id);
			} else {
				// Set thumbs down
				setLocalRating('down');
				await setRating(recipe.recipe.id, false);
			}
		} catch (error) {
			console.error("Error updating rating:", error);
			// Revert local state on error
			setLocalRating(existingRating === null ? null : existingRating ? 'up' : 'down');
		}
	};

	const handleSaveToggle = async (e: any) => {
		// Stop propagation to prevent triggering the card press
		e?.stopPropagation?.();
		
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			await toggleSaveRecipe(recipe.recipe.id);
		} catch (error) {
			console.error("Error toggling saved recipe:", error);
		}
	};

	return (
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
			{/* Recipe Image */}
			<Pressable onPress={handlePress}>
				<View className="p-2 relative">
					<View
						className="aspect-[4/3] w-full overflow-hidden rounded-xl"
						style={{
							shadowColor: "#000000",
							shadowOffset: { width: 0, height: 0 },
							shadowOpacity: 0.3,
							shadowRadius: 8,
							elevation: 8,
						}}
					>
						<Image
							source={
								typeof recipe.recipe.image_url === "string"
									? { uri: recipe.recipe.image_url }
									: recipe.recipe.image_url
							}
							className="w-full h-full"
							contentFit="cover"
						/>
					</View>

					{/* Floating Save Button */}
					<Pressable
						onPress={handleSaveToggle}
						onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						style={{
							position: "absolute",
							top: 12,
							right: 12,
							backgroundColor: isRecipeSaved ? "#fef2f2" : "rgba(255, 255, 255, 0.9)",
							borderRadius: 12,
							padding: 8,
							shadowColor: "#000",
							shadowOffset: { width: 0, height: 2 },
							shadowOpacity: 0.1,
							shadowRadius: 4,
							elevation: 3,
						}}
					>
						<Ionicons
							name={isRecipeSaved ? "heart" : "heart-outline"}
							size={24}
							color={isRecipeSaved ? "#dc2626" : "#9ca3af"}
						/>
					</Pressable>
				</View>

				<View className="px-4 pt-2 pb-4">
					<Text
						className="text-xl font-montserrat-bold text-gray-700 leading-tight"
						numberOfLines={2}
					>
						{recipe.recipe.name}
					</Text>

					{recipe.recipe.description && (
						<Text
							className="text-sm font-montserrat-medium text-gray-500 mt-2 leading-5"
							numberOfLines={2}
						>
							{recipe.recipe.description}
						</Text>
					)}
				</View>
			</Pressable>

			{/* Rating Buttons */}
			<View className="px-4 pb-4">
				<View className="flex-row gap-3">
					<Pressable
						onPress={handleThumbsDown}
						className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-4"
						style={{
							backgroundColor: rating === 'down' ? '#fee2e2' : '#FFFFFF',
							borderWidth: 2,
							borderColor: rating === 'down' ? '#dc2626' : '#EBEBEB',
							borderBottomWidth: rating === 'down' ? 2 : 4,
							borderBottomColor: rating === 'down' ? '#dc2626' : '#EBEBEB',
						}}
					>
						<ThumbsDownIcon
							color={rating === 'down' ? '#dc2626' : '#6b7280'}
							filled={rating === 'down'}
						/>
						<Text
							className="font-montserrat-bold uppercase tracking-wide text-base"
							style={{
								color: rating === 'down' ? '#dc2626' : '#6b7280',
							}}
						>
							Not For Me
						</Text>
					</Pressable>

					<Pressable
						onPress={handleThumbsUp}
						className="flex-1 flex-row items-center justify-center gap-2 rounded-xl py-4"
						style={{
							backgroundColor: rating === 'up' ? '#CCEA1F' : '#FFFFFF',
							borderWidth: 2,
							borderColor: rating === 'up' ? '#25551b' : '#EBEBEB',
							borderBottomWidth: rating === 'up' ? 2 : 4,
							borderBottomColor: rating === 'up' ? '#25551b' : '#EBEBEB',
						}}
					>
						<ThumbsUpIcon
							color={rating === 'up' ? '#25551b' : '#6b7280'}
							filled={rating === 'up'}
						/>
						<Text
							className="font-montserrat-bold uppercase tracking-wide text-base"
							style={{
								color: rating === 'up' ? '#25551b' : '#6b7280',
							}}
						>
							Loved It
						</Text>
					</Pressable>
				</View>
			</View>
		</View>
	);
};