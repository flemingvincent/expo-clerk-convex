import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Pressable } from "react-native";
import { cn } from "@/lib/utils";
import { TextClassContext } from "@/components/ui/text";

const buttonVariants = cva(
	"group flex-row items-center justify-center rounded-2xl web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2",
	{
		variants: {
			variant: {
				default: "bg-lightgreen border-2 border-primary shadow-[0px_4px_0px_0px_#25551b] web:transition-all web:duration-300 active:shadow-[0px_0px_0px_0px_#25551b] active:translate-y-[4px] web:hover:shadow-[0px_0px_0px_0px_#25551b] web:hover:translate-y-[4px]",
				destructive: "bg-destructive border-2 border-destructive shadow-[0px_4px_0px_0px_rgba(239,68,68,0.8)] web:transition-all web:duration-300 active:shadow-[0px_0px_0px_0px_rgba(239,68,68,0.8)] active:translate-y-[4px] web:hover:opacity-90 active:opacity-90",
				outline: "border-2 border-[#EBEBEB] bg-background shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)] web:transition-all web:duration-300 active:shadow-[0px_0px_0px_0px_rgba(0,0,0,0.1)] active:translate-y-[4px] web:hover:bg-accent web:hover:text-accent-foreground",
				secondary: "bg-primary border-2 border-primary shadow-[0px_4px_0px_0px_#71830C] web:transition-all web:duration-300 active:shadow-[0px_0px_0px_0px_#71830C] active:translate-y-[4px] web:hover:shadow-[0px_0px_0px_0px_#71830C] web:hover:translate-y-[4px]",
				funky: "bg-pink border-2 border-primary shadow-[0px_4px_0px_0px_#25551b] web:transition-all web:duration-300 active:shadow-[0px_0px_0px_0px_#25551b] active:translate-y-[4px] web:hover:shadow-[0px_0px_0px_0px_#25551b] web:hover:translate-y-[4px]",
				ghost: "border-2 border-transparent shadow-[0px_4px_0px_0px_transparent] web:transition-all web:duration-300 active:shadow-[0px_0px_0px_0px_transparent] active:translate-y-[4px] web:hover:bg-accent web:hover:text-accent-foreground active:bg-accent",
				link: "border-2 border-transparent shadow-[0px_4px_0px_0px_transparent] web:underline-offset-4 web:hover:underline web:focus:underline",
			},
			size: {
				default: "h-11 px-8 native:h-14",
				sm: "h-9 px-3",
				lg: "h-11 px-8 native:h-14",
				icon: "h-10 w-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "lg",
		},
	},
);

const buttonTextVariants = cva(
	"web:whitespace-nowrap text-sm native:text-base font-medium web:transition-colors web:pointer-events-none",
	{
		variants: {
			variant: {
				default: "text-primary font-montserrat-bold tracking-wide uppercase",
				destructive: "text-destructive-foreground font-montserrat-bold tracking-wide uppercase",
				outline: "text-foreground font-montserrat-semibold tracking-wide uppercase",
				secondary: "text-white font-montserrat-semibold tracking-wide uppercase",
				funky: "text-primary font-montserrat-bold tracking-wide uppercase",
				ghost: "text-foreground font-montserrat-medium",
				link: "text-primary font-montserrat-medium underline",
			},
			size: {
				default: "",
				sm: "text-xs native:text-sm",
				lg: "native:text-lg",
				icon: "",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonProps = React.ComponentPropsWithoutRef<typeof Pressable> &
	VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<
	React.ComponentRef<typeof Pressable>,
	ButtonProps
>(({ className, variant, size, ...props }, ref) => {
	return (
		<TextClassContext.Provider
			value={buttonTextVariants({ variant, size })}
		>
			<Pressable
				className={cn(
					props.disabled && "opacity-50 web:pointer-events-none",
					buttonVariants({ variant, size, className }),
				)}
				ref={ref}
				role="button"
				{...props}
			/>
		</TextClassContext.Provider>
	);
});
Button.displayName = "Button";

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };