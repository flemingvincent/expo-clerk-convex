import {
	createContext,
	PropsWithChildren,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import { supabase } from "@/config/supabase";
import { WeekWithComputed } from "@/types/database";

interface WeeksState {
	weeks: WeekWithComputed[];
	currentWeek: WeekWithComputed | null;
	loading: boolean;
	error: Error | null;
	initialized: boolean;

	// Core methods
	refreshWeeks: () => Promise<void>;

	// Navigation methods
	getWeekById: (weekId: string) => WeekWithComputed | undefined;
	getWeeksRange: (startOffset: number, endOffset: number) => WeekWithComputed[];

	// Helper methods
	isCurrentWeek: (weekId: string) => boolean;
}

const WeeksContext = createContext<WeeksState>({
	weeks: [],
	currentWeek: null,
	loading: false,
	error: null,
	initialized: false,
	refreshWeeks: async () => {},
	getWeekById: () => undefined,
	getWeeksRange: () => [],
	isCurrentWeek: () => false,
});

export const useWeeks = () => {
	const context = useContext(WeeksContext);
	if (!context) {
		throw new Error("useWeeks must be used within WeeksProvider");
	}
	return context;
};

export function WeeksProvider({ children }: PropsWithChildren) {
	const [weeks, setWeeks] = useState<WeekWithComputed[]>([]);
	const [currentWeek, setCurrentWeek] = useState<WeekWithComputed | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [initialized, setInitialized] = useState(false);

	const fetchWeeks = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			if (__DEV__) {
				console.log("📅 Fetching weeks...");
			}

			// Get current date for calculations
			const today = new Date();

			// Fetch weeks around current date (e.g., 4 weeks back, 8 weeks forward)
			const startDate = new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000);
			const endDate = new Date(today.getTime() + 56 * 24 * 60 * 60 * 1000);

			const { data, error: fetchError } = await supabase
				.from("weeks")
				.select("*")
				.gte("end_date", startDate.toISOString().split("T")[0])
				.lte("start_date", endDate.toISOString().split("T")[0])
				.order("start_date", { ascending: true });

			if (fetchError) {
				throw new Error(fetchError.message);
			}

			// Process weeks to add computed properties
			const processedWeeks: WeekWithComputed[] = (data || []).map((week) => {
				const currentWeekData = data?.find((w) => w.is_current_week);
				let weekOffset = 0;

				if (currentWeekData) {
					const currentStart = new Date(currentWeekData.start_date);
					const thisStart = new Date(week.start_date);
					weekOffset = Math.round(
						(thisStart.getTime() - currentStart.getTime()) /
							(7 * 24 * 60 * 60 * 1000),
					);
				}

				// Generate display title
				let displayTitle = week.display_title || "";
				if (!displayTitle) {
					if (week.is_current_week) {
						displayTitle = "This week";
					} else if (weekOffset === 1) {
						displayTitle = "Next week";
					} else if (weekOffset === -1) {
						displayTitle = "Last week";
					} else if (weekOffset > 1) {
						displayTitle = `In ${weekOffset} weeks`;
					} else if (weekOffset < -1) {
						displayTitle = `${Math.abs(weekOffset)} weeks ago`;
					}
				}

				// Determine status
				let status: "past" | "current" | "future" = "future";
				if (week.is_current_week) {
					status = "current";
				} else if (new Date(week.end_date) < today) {
					status = "past";
				} else if (new Date(week.start_date) > today) {
					status = "future";
				}

				return {
					...week,
					displayTitle,
					weekOffset,
					status,
				};
			});

			if (__DEV__) {
				console.log("📅 Weeks processed:", {
					total: processedWeeks.length,
					past: processedWeeks.filter((w) => w.status === "past").length,
					current: processedWeeks.filter((w) => w.status === "current").length,
					future: processedWeeks.filter((w) => w.status === "future").length,
				});
			}

			setWeeks(processedWeeks);

			// Set the current week
			const current = processedWeeks.find((w) => w.is_current_week);
			if (current) {
				setCurrentWeek(current);
				if (__DEV__) {
					console.log("📅 Current week set:", current.displayTitle);
				}
			} else {
				console.warn("⚠️ No current week found in data");
			}

			setInitialized(true);
		} catch (err) {
			const error = err instanceof Error ? err : new Error(String(err));
			console.error("Error fetching weeks:", error);
			setError(error);
		} finally {
			setLoading(false);
		}
	}, []);

	const getWeekById = useCallback(
		(weekId: string): WeekWithComputed | undefined => {
			return weeks.find((w) => w.id === weekId);
		},
		[weeks],
	);

	const getWeeksRange = useCallback(
		(startOffset: number, endOffset: number): WeekWithComputed[] => {
			return weeks.filter(
				(w) => w.weekOffset >= startOffset && w.weekOffset <= endOffset,
			);
		},
		[weeks],
	);

	const isCurrentWeek = useCallback(
		(weekId: string): boolean => {
			const week = getWeekById(weekId);
			return week?.is_current_week ?? false;
		},
		[getWeekById],
	);

	useEffect(() => {
		if (!initialized) {
			fetchWeeks();
		}
	}, [initialized, fetchWeeks]);

	const contextValue = useMemo(
		() => ({
			weeks,
			currentWeek,
			loading,
			error,
			initialized,
			refreshWeeks: fetchWeeks,
			getWeekById,
			getWeeksRange,
			isCurrentWeek,
		}),
		[
			weeks,
			currentWeek,
			loading,
			error,
			initialized,
			fetchWeeks,
			getWeekById,
			getWeeksRange,
			isCurrentWeek,
		],
	);

	return (
		<WeeksContext.Provider value={contextValue}>
			{children}
		</WeeksContext.Provider>
	);
}
