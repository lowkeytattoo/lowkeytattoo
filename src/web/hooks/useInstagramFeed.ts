/**
 * useInstagramFeed
 *
 * Currently returns static data from instagramFeed.ts.
 *
 * — HOW TO MIGRATE TO THE LIVE API —
 *
 * 1. Add the token to .env:
 *      VITE_INSTAGRAM_TOKEN=your_long_lived_token_here
 *
 * 2. Replace this hook's body with the fetch version below:
 *
 *   import { useQuery } from "@tanstack/react-query";
 *   import type { InstagramPost } from "@web/data/instagramFeed";
 *
 *   const FIELDS = "id,caption,media_type,media_url,permalink,timestamp";
 *
 *   async function fetchInstagramFeed(): Promise<InstagramPost[]> {
 *     const token = import.meta.env.VITE_INSTAGRAM_TOKEN;
 *     const res = await fetch(
 *       `https://graph.instagram.com/me/media?fields=${FIELDS}&access_token=${token}`
 *     );
 *     if (!res.ok) throw new Error("Instagram API error");
 *     const json = await res.json();
 *     return json.data as InstagramPost[];
 *   }
 *
 *   export function useInstagramFeed() {
 *     const { data: posts = [], isLoading, isError } = useQuery({
 *       queryKey: ["instagram-feed"],
 *       queryFn: fetchInstagramFeed,
 *       staleTime: 1000 * 60 * 30, // 30 min cache
 *     });
 *     return { posts, isLoading, isError };
 *   }
 *
 * 3. Re-add QueryClientProvider in App.tsx (it was removed as unused).
 *
 * That's it — the component doesn't need any changes.
 */

import { staticPosts, type InstagramPost } from "@web/data/instagramFeed";

export function useInstagramFeed() {
  return {
    posts: staticPosts as InstagramPost[],
    isLoading: false,
    isError: false,
  };
}
