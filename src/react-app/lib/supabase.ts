import { createClient } from "@supabase/supabase-js";

export type TipResult = "pending" | "won" | "lost";

export type Tip = {
	id: string;
	league: string;
	match_date: string;
	kickoff: string;
	home_team: string;
	away_team: string;
	pick: string;
	odds: number;
	confidence: number;
	analysis: string | null;
	result: TipResult;
	score: string | null;
	published: boolean;
	created_at: string;
	updated_at: string;
};

type TipInsert = Omit<Tip, "id" | "created_at" | "updated_at">;

type Database = {
	public: {
		Tables: {
			tips: {
				Row: Tip;
				Insert: TipInsert;
				Update: Partial<TipInsert>;
				Relationships: [];
			};
		};
		Views: Record<never, never>;
		Functions: Record<never, never>;
		Enums: { tip_result: TipResult };
		CompositeTypes: Record<never, never>;
	};
};

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient<Database>(url, key) : null;
