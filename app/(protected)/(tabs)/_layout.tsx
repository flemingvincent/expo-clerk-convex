import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/constants/colors";

export default function TabsLayout() {

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: "white", // Always white background
					borderTopWidth: 1,
					borderTopColor: "#e5e5e5", // Optional: subtle border
					paddingBottom: 15, // Increased bottom padding
					paddingTop: 8,
					height: 85, // Increased height to accommodate labels
				},
				tabBarActiveTintColor: colors.light.primary || "#007AFF", // Active tab color
				tabBarInactiveTintColor: "#8E8E93", // Inactive tab color
				tabBarShowLabel: true, // Show labels
				tabBarLabelStyle: {
					fontSize: 11, // Small font size
					marginTop: 4, // Space between icon and label
				},
			}}
		>
			<Tabs.Screen 
				name="index" 
				options={{ 
					title: "Plan",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="home" size={size} color={color} />
					),
				}} 
			/>
			{/* <Tabs.Screen 
				name="explore" 
				options={{ 
					title: "Explore",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="search" size={size} color={color} />
					),
				}} 
			/> */}
			<Tabs.Screen 
				name="saved" 
				options={{ 
					title: "Favourites",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="heart" size={size} color={color} />
					),
				}} 
			/>
			<Tabs.Screen 
				name="cart" 
				options={{ 
					title: "Shop",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="cart" size={size} color={color} />
					),
				}} 
			/>
			<Tabs.Screen 
				name="profile" 
				options={{ 
					title: "Profile",
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="person" size={size} color={color} />
					),
				}} 
			/>
		</Tabs>
	);
}