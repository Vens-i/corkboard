# CorkBoard - AI Coding Agent Instructions

CorkBoard is a community-driven bulletin board app built with **SvelteKit**, **Svelte 5**, **Tailwind CSS 4.1**, and **Supabase**.

## Architecture Overview

- **Framework**: SvelteKit with TypeScript, using Svelte 5 features
- **Styling**: Tailwind CSS 4.1 with Vite plugin integration (`@tailwindcss/vite`)
- **Backend**: Supabase for authentication and database
- **Build**: Vite with `@sveltejs/adapter-auto`

## Authentication Patterns

### Environment Variables

**Browser (client-side):**

- `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from `.env`
- Imported via `$env/static/public` in browser code

**Server (server-side):**

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` from `.env` (private pair)
- Imported via `$env/static/private` in all server files (hooks, +page.server.ts, +server.ts)
- Never use VITE\_\* or process.env on the server

### Browser Client Singleton

Use the browser client from `src/lib/supabaseClient.ts`:

```typescript
import { supabase } from '$lib/supabaseClient';
const client = supabase(); // singleton pattern
```

### Server Client with Cookie Adapter

In `src/hooks.server.ts`, `+page.server.ts`, and `+server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
	cookies: {
		getAll() {
			/* reads cookies from request */
		},
		setAll(cookies) {
			/* writes cookies via event.cookies */
		}
	}
});
```

The cookie adapter must support `getAll` and `setAll` methods to avoid SSR cookie warnings.

### Auth Flow

1. **User clicks "Continue with Google"** → Browser calls `client.auth.signInWithOAuth()`
2. **Google OAuth redirect** → Returns to `/auth/callback?code=...&state=...`
3. **`/auth/callback/+page.server.ts`** → Exchanges code using `supabase.auth.exchangeCodeForSession(code)`
4. **Cookie set** → Auth cookies written to response
5. **Redirect to `/board`** → Browser loads with cookies
6. **`hooks.server.ts` runs** → Reads cookies, calls `getSession()`, sets `event.locals.user`
7. **`+layout.server.ts`** → Returns `{ user, session }` to all routes
8. **Header updates** → Shows "New Post", "Profile", "Logout" when user is authenticated

### Auth State Management

- Session/user available via `event.locals` in server code
- Passed to all pages through `+layout.server.ts` → `+layout.svelte`
- Access in components: `export let data; const user = data.user;`

### Logout

POST to `/auth?logout` which triggers the default action in `src/routes/auth/+page.server.ts` to sign out and redirect to `/board`.

## SvelteKit Conventions

### Type Safety

- Global types in `src/app.d.ts` define `App.Locals` and `App.PageData`
- Use `Session | null` and `User | null` for auth types

### Route Structure

- Main layout at `src/routes/+layout.svelte` with responsive header/nav
- Server load functions return `{ session, user }` consistently
- Auth routes under `/auth/` directory

## Development Workflow

### Scripts (from package.json)

- `npm run dev` - Start development server
- `npm run check` - TypeScript and Svelte type checking
- `npm run format` - Prettier formatting
- `npm run lint` - ESLint + Prettier checks

### Environment Setup

- Uses `.env` file with `PUBLIC_SUPABASE_*` vars for client-side
- `SUPABASE_SERVICE_ROLE_KEY` for server operations (when needed)
- App config vars like `APP_NAME`, `APP_BASE_URL` for environment-specific settings

## Styling Patterns

- Tailwind CSS 4.1 via Vite plugin (not PostCSS)
- Consistent utility patterns: `min-h-screen flex flex-col`, `border rounded`, `hover:underline`
- Form styling: `px-3 py-1 border rounded` for buttons

## Project-Specific Notes

- Currently in development phase with placeholder content
- Posts data structure suggests community board functionality (title, description, created_at)
- Clean, minimal UI approach with gray color palette
- Responsive design with mobile-first approach

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
