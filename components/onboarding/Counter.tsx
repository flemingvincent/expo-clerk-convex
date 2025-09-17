import React from "react";
import { View, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/ui/text";
import * as Haptics from 'expo-haptics';

interface CounterProps {
	value: number;
	onIncrement: () => void;
	onDecrement: () => void;
	label: string;
	min?: number;
	max?: number;
}

const Counter = ({
	value,
	onIncrement,
	onDecrement,
	label,
	min = 1,
	max = 20,
}: CounterProps) => {

	const isMinDisabled = value <= min;
	const isMaxDisabled = value >= max;

	return (
		<View className="mb-4">
			<Text className="text-primary text-base mb-3 ml-1 font-medium">
				{label}
			</Text>

			<View className="bg-white/90 rounded-xl p-4 border border-primary/20">
				<View className="flex-row items-center justify-between">
					<View className="flex-1 items-center">
						<Text className="text-primary text-3xl font-bold">{value}</Text>
					</View>

					<View className="flex-row items-center">
						<Pressable
							onPress={onDecrement}
                            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							disabled={isMinDisabled}
							className={`h-12 w-12 rounded-full items-center justify-center mr-3 ${
								isMinDisabled
									? "bg-gray-100 border border-gray-200"
									: "bg-white border-2 border-primary"
							}`}
							accessibilityRole="button"
							accessibilityLabel={`Decrease ${label}`}
							accessibilityHint={`Decrease the number of ${label} by 1`}
							accessibilityState={{ disabled: isMinDisabled }}
						>
							<Ionicons
								name="remove"
								size={24}
								color={isMinDisabled ? "#9CA3AF" : "#25551B"}
							/>
						</Pressable>

						<Pressable
							onPress={onIncrement}
                            onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
							disabled={isMaxDisabled}
							className={`h-12 w-12 rounded-full items-center justify-center ${
								isMaxDisabled
									? "bg-gray-100 border border-gray-200"
									: "bg-primary border-2 border-primary"
							}`}
							accessibilityRole="button"
							accessibilityLabel={`Increase ${label}`}
							accessibilityHint={`Increase the number of ${label} by 1`}
							accessibilityState={{ disabled: isMaxDisabled }}
						>
							<Ionicons
								name="add"
								size={24}
								color={isMaxDisabled ? "#9CA3AF" : "#fff"}
							/>
						</Pressable>
					</View>
				</View>
			</View>
		</View>
	);
};

export default Counter;
