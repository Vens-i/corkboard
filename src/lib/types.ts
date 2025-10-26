// src/lib/types.ts
export type Post = {
	id: string;
	user_id: string;
	owner_id?: string;
	category_id: number | null;
	title: string;
	description: string | null;
	price: string | number | null;
	city: string | null;
	state: string | null;
	zipcode: string | null;
	location: string | null;
	latitude: number | null;
	longitude: number | null;
	is_taken: boolean;
	created_at: string;
	// Optional front-end only fields:
	distance_miles?: number | null;
	image_url?: string | null; // if you later derive from Storage
};
