import type { Session, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session?: Session | null;
			user?: User | null;
		}
	}

	interface ImportMetaEnv {
		readonly VITE_GOOGLE_MAPS_API_KEY: string;
	}

	interface ImportMeta {
		readonly env: ImportMetaEnv;
	}
}

declare module '$env/static/private' {
	export const GOOGLE_MAPS_SERVER_KEY: string;
}

export {};
