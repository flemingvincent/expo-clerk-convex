// components/onboarding/DietaryStep.tsx (PreferencesStep)
import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, ScrollView, Animated, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Text as SvgText } from "react-native-svg";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { FormData } from "@/constants/onboarding";
import type { Tag, TagType } from "@/types/database";
import { useReferenceData } from "@/context/reference-data-provider";
import * as Haptics from 'expo-haptics';

interface PreferencesStepProps {
	formData: FormData;
	handleFormChange: (field: keyof FormData, value: any) => void;
	onNext: () => void;
	isLoading: boolean;
}

type GroupedTags = Record<string, Tag[]>;

const PreferencesStep: React.FC<PreferencesStepProps> = ({
	formData,
	handleFormChange,
	onNext,
	isLoading,
}) => {
    const { tags } = useReferenceData();
    const [groupedTags, setGroupedTags] = useState<GroupedTags>({});

	const contentOpacity = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const buttonOpacity = useRef(new Animated.Value(0)).current;
	const buttonTranslateY = useRef(new Animated.Value(20)).current;

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

	useEffect(() => {
		const groups: GroupedTags = {};

		tags.forEach((tag) => {
			if (tag.type === "goal" || tag.type === "meal_type") return;

			const type = tag.type;
			if (!groups[type]) {
				groups[type] = [];
			}
			groups[type].push(tag);
		});

		setGroupedTags(groups);
	}, [tags]);

	const toggleTag = (tagId: string) => {
		const currentUserPreferenceTags = formData.userPreferenceTags || [];
		
		const existingTagIndex = currentUserPreferenceTags.findIndex(
			(tag) => tag.tag_id === tagId,
		);

		let updatedPreferences;
		if (existingTagIndex !== -1) {
			updatedPreferences = currentUserPreferenceTags.filter(
				(tag) => tag.tag_id !== tagId,
			);
		} else {
			updatedPreferences = [
				...currentUserPreferenceTags,
				{
					tag_id: tagId
				},
			];
		}

		handleFormChange("userPreferenceTags", updatedPreferences);
	};

	const getTypeDisplayName = (type: TagType | string): string => {
		const typeDisplayNames: Record<string, string> = {
			allergen: "Allergies & Intolerances",
			diet: "Dietary Preferences",
			budget: "Budget Preferences",
			time: "Cooking Time",
			macro: "Health / Macro Goals",
			cuisine: "Cuisines",
			skill_level: "Recipe Difficulty",
			method: "Cooking Methods",
			equipment: "Kitchen Equipment",
			seasonal: "Seasonal Preferences",
			occasion: "Occasions",
			category: "Categories",
			protein: "Protein Types",
		};

		return typeDisplayNames[type] || 
			type.split("_")
				.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
				.join(" ");
	};

	const typeOrder: (TagType | string)[] = [
		"allergen",
		"diet",
		"budget",
		"time",
		"macro",
		"cuisine",
		"skill_level",
		"method",
		"equipment",
		"seasonal",
		"occasion",
		"category",
		"protein",
	];

	const selectedCount = formData.userPreferenceTags.filter(pref => {
		const tag = tags.find(t => t.id === pref.tag_id);
		return tag && tag.type !== "goal" && tag.type !== "meal_type";
	}).length;

	return (
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
				<Svg width="380" height="60">
					<SvgText
						x="190"
						y="50"
						textAnchor="middle"
						fill="#25551b"
						stroke="#E2F380"
						strokeWidth="0"
						letterSpacing="2"
						fontFamily="MMDisplay"
						fontSize="28"
						fontWeight="bold"
					>
						PREFERENCES
					</SvgText>
				</Svg>
				<Text className="text-primary text-lg text-center px-4">
					Tell us your preferences to find perfect recipes
				</Text>
				<Text className="text-primary/60 text-sm text-center px-4 mt-1">
					Select any and all that apply. We will tailor recommendations based on
					your selections.
				</Text>
				{selectedCount > 0 && (
					<Text className="text-primary/60 text-sm text-center px-4 mt-1">
						{selectedCount} preference{selectedCount !== 1 ? 's' : ''} selected
					</Text>
				)}
			</Animated.View>

			{/* Form Container matching PlanningStep style */}
			<Animated.View
				style={{
					opacity: contentOpacity,
					transform: [{ translateY: contentTranslateY }],
				}}
				className="w-full bg-background/80 rounded-2xl p-6 shadow-md mb-12"
			>
				{tags.length < 1 ? (
					<View className="items-center justify-center py-20">
						<Text className="text-primary/70">Loading options...</Text>
					</View>
				) : (
					<View className="gap-6">
						{typeOrder.map(
							(type) =>
								groupedTags[type] &&
								groupedTags[type].length > 0 && (
									<View key={type}>
										{/* Section Header */}
										<Text className="text-primary text-base mb-3 ml-1 font-medium">
											{getTypeDisplayName(type)}
										</Text>

										{/* Tags Container */}
										<View className="bg-white/50 rounded-xl p-4 border border-primary/10">
											<View className="flex-row flex-wrap -m-1">
												{groupedTags[type].map((tag) => {
													const isSelected = formData.userPreferenceTags.some(
														(t) => t.tag_id === tag.id,
													);

													return (
														<Pressable
															key={tag.id}
															onPress={() => toggleTag(tag.id)}
                                                            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
															className={`px-3 py-2 m-1 rounded-full border ${
																isSelected
																	? "bg-primary border-primary"
																	: "bg-white border-primary/30"
															}`}
															accessibilityRole="button"
															accessibilityLabel={`${isSelected ? "Remove" : "Add"} ${tag.name} preference`}
															accessibilityHint={`Toggle ${tag.name} as a preference`}
															accessibilityState={{ selected: isSelected }}
														>
															<View className="flex-row items-center">
																<Text
																	className={`font-medium text-sm ${
																		isSelected ? "text-white" : "text-primary"
																	}`}
																>
																	{tag.name}
																</Text>

																{isSelected && (
																	<Ionicons
																		name="checkmark"
																		size={14}
																		color="#fff"
																		style={{ marginLeft: 4 }}
																	/>
																)}
															</View>
														</Pressable>
													);
												})}
											</View>
										</View>
									</View>
								),
						)}

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
								variant="funky"
								onPress={onNext}
                                onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
								disabled={isLoading}
								className="w-full"
								accessibilityRole="button"
								accessibilityLabel="Complete onboarding"
								accessibilityHint="Finish the onboarding process and start using the app"
								accessibilityState={{
									disabled: isLoading,
									busy: isLoading,
								}}
							>
								<View className="flex-row items-center justify-center">
									<Text className="text-primary text-xl mr-2 font-semibold">
										{isLoading ? "Saving..." : "Let's get cooking"}
									</Text>
									<Ionicons name="arrow-forward" size={20} color="#25551b" />
								</View>
							</Button>
						</Animated.View>
					</View>
				)}
			</Animated.View>
		</ScrollView>
	);
};

export default PreferencesStep;