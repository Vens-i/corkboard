import {
	createServerClient,
	type CookieMethodsServer,
	type CookieMethodsServerDeprecated,
	type CookieOptions
} from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import type { RequestEvent, Cookies } from '@sveltejs/kit';
import type { SerializeOptions } from 'cookie';

type SupabaseCookieMethods = CookieMethodsServer &
	CookieMethodsServerDeprecated & {
		removeAll: (cookies: { name: string; options?: CookieOptions }[]) => void;
	};

type CookieList = ReturnType<Cookies['getAll']>;

const withDefaultPath = (options?: CookieOptions): SerializeOptions & { path: string } =>
	({
		path: '/',
		...(options ?? {})
	} as SerializeOptions & { path: string });

const mapCookies = (cookies: CookieList) =>
	cookies.map(({ name, value }) => ({ name, value }));

const createCookieAdapter = (event: RequestEvent): SupabaseCookieMethods => ({
	get: (name) => event.cookies.get(name),
	getAll: () => mapCookies(event.cookies.getAll()),
	set: (name, value, options) => {
		event.cookies.set(name, value, withDefaultPath(options));
	},
	setAll: (cookies: { name: string; value: string; options?: CookieOptions }[]) => {
		cookies.forEach(({ name, value, options }) => {
			event.cookies.set(name, value, withDefaultPath(options));
		});
	},
	remove: (name, options) => {
		event.cookies.delete(name, withDefaultPath(options));
	},
	removeAll: (cookies: { name: string; options?: CookieOptions }[]) => {
		cookies.forEach(({ name, options }) => {
			event.cookies.delete(name, withDefaultPath(options));
		});
	}
});

export const createSupabaseServerClient = (event: RequestEvent) =>
	createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
		cookies: createCookieAdapter(event)
	});
