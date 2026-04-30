import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveImage(
  imageUrl?: string | null,
  unsplashId?: string | null,
  w = 1400
): string | null {
  if (imageUrl) return imageUrl;
  if (unsplashId)
    return `https://images.unsplash.com/${unsplashId}?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=75&w=${w}`;
  return null;
}
