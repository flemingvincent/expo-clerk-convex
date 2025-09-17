import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Animated, ScrollView, Dimensions } from "react-native";
import { useRouter, Link } from "expo-router";
import * as Haptics from 'expo-haptics';

import Svg, { Text as SvgText } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "@/components/image";
import { SafeAreaView } from "@/components/safe-area-view";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { usePressAnimation } from "@/hooks/onPressAnimation";

const { width: screenWidth } = Dimensions.get('window');

export default function WelcomeScreen() {
	const router = useRouter();
	const appIcon = require("@/assets/mealmate-logo.png");
    const slide2Icon = require("@/assets/phone-and-groceries.png");
	const scrollViewRef = useRef<ScrollView>(null);
	const [currentSlide, setCurrentSlide] = useState(0);

    interface CarouselItem {
        id: number;
        title: string;
        subtitle: string;
        image: any;
    }

	// Carousel data
	const carouselData: CarouselItem[] = [
		{
			id: 1,
			title: "Smart meals, your way",
			subtitle: "Easy planning, real groceries, no waste",
			image: appIcon,
		},
		{
			id: 2,
			title: "Get your weekly groceries",
			subtitle: "In a single click",
			image: slide2Icon,
		},
		{
			id: 3,
			title: "Reduce waste",
			subtitle: "With smart meal combinations",
			image: slide2Icon,
		},
	];

    const buttonPress = usePressAnimation({
		hapticStyle: 'Medium',
		pressDistance: 4,
	});

	const signInPress = usePressAnimation({
		hapticStyle: 'Light',
		pressDistance: 2,
	});

	// Animation values - simplified
	const contentOpacity = useRef(new Animated.Value(0)).current;
	const contentTranslateY = useRef(new Animated.Value(20)).current;
	const buttonOpacity = useRef(new Animated.Value(0)).current;
	const buttonTranslateY = useRef(new Animated.Value(20)).current;

	// Pagination dot animations
	const dotAnimations = useRef(
		carouselData.map(() => ({
			scale: new Animated.Value(0.8),
			opacity: new Animated.Value(0.5),
		}))
	).current;

	useEffect(() => {
		// Fast entrance animations - content first
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

		// Button entrance shortly after
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

		// Initialize pagination dots
		updatePaginationDots(0);

		return () => {
			clearTimeout(contentTimer);
			clearTimeout(buttonTimer);
		};
	}, []);

	const updatePaginationDots = (activeIndex: number) => {
		dotAnimations.forEach((dotAnim, index) => {
			if (index === activeIndex) {
				Animated.parallel([
					Animated.timing(dotAnim.scale, {
						toValue: 1.2,
						duration: 150,
						useNativeDriver: true,
					}),
					Animated.timing(dotAnim.opacity, {
						toValue: 1,
						duration: 150,
						useNativeDriver: true,
					}),
				]).start();
			} else {
				Animated.parallel([
					Animated.timing(dotAnim.scale, {
						toValue: 0.8,
						duration: 150,
						useNativeDriver: true,
					}),
					Animated.timing(dotAnim.opacity, {
						toValue: 0.5,
						duration: 150,
						useNativeDriver: true,
					}),
				]).start();
			}
		});
	};

    interface ScrollEvent {
        nativeEvent: {
            contentOffset: {
                x: number;
                y: number;
            };
        };
    }

    const onScroll = (event: ScrollEvent): void => {
        const slideIndex: number = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
        if (slideIndex !== currentSlide) {
            setCurrentSlide(slideIndex);
            updatePaginationDots(slideIndex);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const renderCarouselItem = (item: CarouselItem, index: number) => (
        <View key={item.id} style={{ width: screenWidth }} className="flex items-center justify-center px-4">
            <Animated.View 
                style={{
                    opacity: contentOpacity,
                    transform: [{ translateY: contentTranslateY }]
                }}
                className="flex flex-col items-center mb-6"
            >
                <Text className="text-primary text-3xl font-bold mb-2 text-center">
                    {item.title}
                </Text>
                <Text className="text-primary text-2xl text-center">
                    {item.subtitle}
                </Text>
            </Animated.View>

            <Animated.View 
                style={{
                    opacity: contentOpacity,
                    transform: [{ translateY: contentTranslateY }]
                }}
                className="w-full flex justify-center items-center my-8"
            >
                <Image
                    source={item.image}
                    className="w-80 h-80 mx-auto"
                    contentFit="contain"
                />
            </Animated.View>
        </View>
    );

	return (
		<SafeAreaView className="flex flex-1 bg-lightgreen">
			{/* Carousel Content */}
			<View className="flex-1 justify-center">
				<ScrollView
					ref={scrollViewRef}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					onScroll={onScroll}
					scrollEventThrottle={16}
					decelerationRate="fast"
					snapToInterval={screenWidth}
					snapToAlignment="center"
				>
					{carouselData.map((item, index) => renderCarouselItem(item, index))}
				</ScrollView>

				{/* Pagination Dots */}
				<View className="flex-row justify-center items-center py-4">
					{carouselData.map((_, index) => (
						<TouchableOpacity
							key={index}
							onPress={() => {
								scrollViewRef.current?.scrollTo({
									x: index * screenWidth,
									animated: true,
								});
								Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
							}}
							className="mx-2"
						>
							<Animated.View
								style={{
									transform: [{ scale: dotAnimations[index].scale }],
									opacity: dotAnimations[index].opacity,
								}}
								className="w-3 h-3 rounded-full bg-primary"
							/>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Bottom Button Section */}
			<Animated.View
				className="px-4 pb-6 mt-6"
			>
				<View className="w-full flex-col justify-center items-center gap-4">
					<Button
						variant="secondary"
						className="w-full"
						size={"lg"}
						onPress={() => {							
							router.push("/sign-up");
						}}
                        {...buttonPress}
					>
						<Text className="text-white !text-xl mr-2">
							Get Started
						</Text>
						<Ionicons name="arrow-forward" size={20} color="#fff" />
					</Button>

					<View className="flex-row">
						<Text className="text-primary">Already have an account? </Text>
						<Link href="/sign-in" asChild>
							<TouchableOpacity
                                {...signInPress}
							>
								<Text className="text-primary font-bold">Sign in</Text>
							</TouchableOpacity>
						</Link>
					</View>
				</View>
			</Animated.View>
		</SafeAreaView>
	);
}