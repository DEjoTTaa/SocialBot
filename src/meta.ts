import { META_TOKEN, IG_USER_ID } from "./config.js";

const BASE = "https://graph.facebook.com/v25.0";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export interface MediaItem {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
}

interface BusinessDiscoveryResponse {
  business_discovery: {
    followers_count: number;
    media?: {
      data: MediaItem[];
    };
  };
}

export async function buscarSeguidores(
  username: string
): Promise<{ seguidores: number }> {
  const fields = `business_discovery.username(${username}){followers_count}`;
  const url = `${BASE}/${IG_USER_ID}?fields=${encodeURIComponent(fields)}&access_token=${META_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as any)?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const data = (await res.json()) as BusinessDiscoveryResponse;
  return { seguidores: data.business_discovery.followers_count };
}

export async function buscarPosts(
  username: string
): Promise<{ seguidores: number; posts: MediaItem[] }> {
  const fields = `business_discovery.username(${username}){followers_count,media.limit(15){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count}}`;
  const url = `${BASE}/${IG_USER_ID}?fields=${encodeURIComponent(fields)}&access_token=${META_TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg =
      (body as any)?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  const data = (await res.json()) as BusinessDiscoveryResponse;
  return {
    seguidores: data.business_discovery.followers_count,
    posts: data.business_discovery.media?.data ?? [],
  };
}

export { sleep };
