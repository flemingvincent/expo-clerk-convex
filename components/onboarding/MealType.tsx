// components/onboarding/MealTypesStep.tsx
import React, { useRef, useEffect, useState } from "react";
import { View, TouchableOpacity, ScrollView, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Text as SvgText } from "react-native-svg";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "@/components/safe-area-view";
import { useReferenceData } from "@/context/reference-data-provider";
import { FormData } from "@/constants/onboarding";
import type { Tag } from "@/types/database";
import * as Haptics from 'expo-haptics';

interface MealTypesStepProps {
	formData: FormData;
	handleFormChange: (field: keyof FormData, value: any) => void;
	onNext: () => void;
	isLoading: boolean;
}

const MealTypesStep: React.FC<MealTypesStepProps> = ({
	formData,
	handleFormChange,
	onNext,
	isLoading,
}) => {
    const { tags, getTagsByType } = useReferenceData();
    const [mealTypeTags, setMealTypeTags] = useState<Tag[]>([]);
	
	const contentOpacity = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const buttonOpacity = useRef(new Animated.Value(0)).current;
	const buttonTranslateY = useRef(new Animated.Value(20)).current;

	useEffect(() => {
        const filteredMealTypeTags = getTagsByType("meal_type");
        setMealTypeTags(filteredMealTypeTags);
	}, [tags, getTagsByType]);

	useEffect(() => {
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

	const toggleMealType = (mealTypeTag: Tag) => {
		const currentUserPreferenceTags = formData.userPreferenceTags || [];
		
		const isCurrentlySelected = currentUserPreferenceTags.some(
			pref => pref.tag_id === mealTypeTag.id
		);

		let updatedTags;
		if (isCurrentlySelected) {
			updatedTags = currentUserPreferenceTags.filter(
				pref => pref.tag_id !== mealTypeTag.id
			);
		} else {
			updatedTags = [
				...currentUserPreferenceTags,
				{ tag_id: mealTypeTag.id, }
			];
		}

		handleFormChange("userPreferenceTags", updatedTags);
	};

	const isSelected = (mealTypeTag: Tag): boolean => {
		const currentUserPreferenceTags = formData.userPreferenceTags || [];
		return currentUserPreferenceTags.some(pref => pref.tag_id === mealTypeTag.id);
	};

	const selectedCount = mealTypeTags.filter(tag => isSelected(tag)).length;

	return (
		<SafeAreaView className="flex-1 bg-lightgreen" edges={["top"]}>
			<ScrollView
				className="flex-1"
				showsVerticalScrollIndicator={false}
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
			>
				<Animated.View
					style={{
						opacity: contentOpacity,
						transform: [{ translateY: contentTranslateY }],
					}}
					className="items-center mt-8 mb-8"
				>
					<Svg width="320" height="60">
						<SvgText
							x="160"
							y="50"
							textAnchor="middle"
							fill="#25551b"
							stroke="#E2F380"
							strokeWidth="0"
							letterSpacing="2"
							fontFamily="MMDisplay"
							fontSize="30"
							fontWeight="bold"
						>
							MEAL TYPES
						</SvgText>
					</Svg>
					<Text className="text-primary text-lg text-center px-4">
						What type of meals fit your household?
					</Text>
					{selectedCount > 0 && (
						<Text className="text-primary/60 text-sm text-center px-4 mt-1">
							{selectedCount} selected
						</Text>
					)}
				</Animated.View>

				<Animated.View
					style={{
						opacity: contentOpacity,
						transform: [{ translateY: contentTranslateY }],
					}}
					className="w-full bg-background/80 rounded-2xl p-6 shadow-md"
				>
					<View className="gap-4">
						<View className="mb-4">
							<Text className="text-primary text-base mb-4 ml-1 font-medium">
								Choose all that apply
							</Text>

							{mealTypeTags.length > 0 ? (
								<View className="gap-3">
									{mealTypeTags.map((mealTypeTag) => (
										<Pressable
											key={mealTypeTag.id}
											onPress={() => toggleMealType(mealTypeTag)}
                                            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
											className={`w-full p-4 rounded-xl border-2 ${
												isSelected(mealTypeTag)
													? "bg-primary/10 border-primary"
													: "bg-white/90 border-primary/20"
											}`}
											accessibilityRole="button"
											accessibilityLabel={`${isSelected(mealTypeTag) ? "Remove" : "Add"} ${mealTypeTag.name} meal type`}
											accessibilityHint={`Toggle ${mealTypeTag.name} as a meal type preference`}
											accessibilityState={{ selected: isSelected(mealTypeTag) }}
										>
											<View className="flex-row items-center justify-between">
												<Text
													className={`text-lg font-medium ${
														isSelected(mealTypeTag)
															? "text-primary"
															: "text-primary/80"
													}`}
												>
													{mealTypeTag.name}
												</Text>

												{isSelected(mealTypeTag) && (
													<View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
														<Ionicons name="checkmark" size={16} color="#fff" />
													</View>
												)}
											</View>
										</Pressable>
									))}
								</View>
							) : (
								<View className="p-4 bg-white/50 rounded-xl">
									<Text className="text-primary/60 text-center">
										Loading meal types...
									</Text>
								</View>
							)}
						</View>

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
                                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
								disabled={isLoading || mealTypeTags.length === 0}
								className="w-full"
								accessibilityRole="button"
								accessibilityLabel="Continue to next step"
								accessibilityHint="Proceed to the dietary preferences step of onboarding"
								accessibilityState={{
									disabled: isLoading || mealTypeTags.length === 0,
									busy: isLoading,
								}}
							>
								<View className="flex-row items-center justify-center">
									<Text className="text-primary text-xl mr-2 font-semibold">
										{isLoading ? "Saving..." : selectedCount === 0 ? "Skip" : "Continue"}
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

export default MealTypesStep;