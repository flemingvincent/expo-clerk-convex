import "../global.css";
import { Stack } from "expo-router";

import { AuthProvider } from "@/context/supabase-provider";
import { MealPlanProvider } from "@/context/meal-plan-provider";
import { ReferenceDataProvider } from "@/context/reference-data-provider";
import { UserPreferencesProvider } from "@/context/user-preferences-provider";
import { RecipeProvider } from "@/context/recipe-data-provider";
import { WeeksProvider } from "@/context/week-data-provider";


export default function AppLayout() {

	return (
		<AuthProvider>
            <ReferenceDataProvider>
                <UserPreferencesProvider>
                    <WeeksProvider>
                        <RecipeProvider>
                            <MealPlanProvider>
                                <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
                                    <Stack.Screen name="(protected)" />
                                    <Stack.Screen name="welcome" />
                                    <Stack.Screen
                                        name="sign-up"
                                        options={{
                                            presentation: "card",
                                            headerShown: false,
                                            gestureEnabled: true,
                                        }}
                                    />
                                    <Stack.Screen
                                        name="sign-in"
                                        options={{
                                            presentation: "card",
                                            headerShown: false,
                                            gestureEnabled: true,
                                        }}
                                    />
                                </Stack>
                            </MealPlanProvider>
                        </RecipeProvider>
                    </WeeksProvider>
                </UserPreferencesProvider>
            </ReferenceDataProvider>
		</AuthProvider>
	);
}
