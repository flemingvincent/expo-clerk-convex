import { useRef } from "react";
import { Animated } from "react-native";
import * as Haptics from "expo-haptics";

interface UsePressAnimationOptions {
	hapticStyle?: "Light" | "Medium" | "Heavy";
	pressDistance?: number;
	duration?: number;
}

export const usePressAnimation = (options: UsePressAnimationOptions = {}) => {
	const {
		hapticStyle = "Medium",
		pressDistance = 4,
		duration = 150,
	} = options;

	// Animation values
	const translateY = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(1)).current;

	const handlePressIn = () => {
		// Trigger haptic feedback immediately
		const hapticType = {
			Light: Haptics.ImpactFeedbackStyle.Light,
			Medium: Haptics.ImpactFeedbackStyle.Medium,
			Heavy: Haptics.ImpactFeedbackStyle.Heavy,
		}[hapticStyle];

		Haptics.impactAsync(hapticType);

		// Start press animation
		const animations = [
			Animated.timing(translateY, {
				toValue: pressDistance,
				duration,
				useNativeDriver: true,
			}),
			Animated.timing(scale, {
				toValue: 0.98,
				duration,
				useNativeDriver: true,
			}),
		];

		Animated.parallel(animations).start();
	};

	const handlePressOut = () => {
		// Return to original state
		const animations = [
			Animated.timing(translateY, {
				toValue: 0,
				duration,
				useNativeDriver: true,
			}),
			Animated.timing(scale, {
				toValue: 1,
				duration,
				useNativeDriver: true,
			}),
		];

		Animated.parallel(animations).start();
	};

	return {
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
	};
};
