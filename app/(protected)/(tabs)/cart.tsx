import { View, ScrollView, ActivityIndicator } from "react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { H1, H3, Muted } from "@/components/ui/typography";
import { router } from "expo-router";
import { useCart } from "@/context/cart-provider";

export default function Cart() {
	const { ingredients, totalIngredients, loading, initialized } = useCart();

	const formatQuantity = (
		quantity: number,
		abbreviation: string | null,
		unitName: string | null
	) => {
		if (quantity === 0) return "As needed";
		
		// Format number to avoid long decimals
		const formattedQty =
			quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
		const unit = abbreviation || unitName || "units";
		return `${formattedQty} ${unit}`;
	};

	if (!initialized || loading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" />
				<Muted className="mt-4">Loading shopping cart...</Muted>
			</View>
		);
	}

	if (ingredients.length === 0) {
		return (
			<View className="flex-1 items-center justify-center bg-background p-4 gap-y-4">
				<H1 className="text-center">Shopping Cart</H1>
				<Muted className="text-center">
					Your cart is empty. Add meals to your plan to see ingredients here.
				</Muted>
				<Button onPress={() => router.back()}>
					<Text>Go Back</Text>
				</Button>
			</View>
		);
	}

	return (
		<View className="flex-1 bg-background">
			<ScrollView className="flex-1 p-4">
				<H1 className="mb-2">Shopping Cart</H1>
				<Muted className="mb-4">
					{totalIngredients} ingredient{totalIngredients !== 1 ? "s" : ""} from{" "}
					{ingredients.reduce((acc, item) => acc + item.recipes.length, 0)}{" "}
					recipe instances
				</Muted>

				<View className="gap-y-2">
					{ingredients.map((item) => (
						<View key={`${item.ingredient_id}_${item.unit_id}`}>
							<View className="p-4">
								<View>
									<Text className="font-semibold text-base">
										{item.ingredient_name}
									</Text>
									<Text className="text-sm text-muted-foreground mt-1">
										{formatQuantity(
											item.total_quantity,
											item.unit_abbreviation,
											item.unit_name
										)}
									</Text>
									<View className="mt-2">
										{item.recipes.map((recipe, index) => (
											<Muted key={`${recipe.recipe_id}_${index}`} className="text-xs">
												• {recipe.recipe_name} ({recipe.servings} servings)
											</Muted>
										))}
									</View>
								</View>
							</View>
						</View>
					))}
				</View>
			</ScrollView>
		</View>
	);
}