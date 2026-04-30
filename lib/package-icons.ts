export const PACKAGE_ICONS = {
  new:      { label: "New",     emoji: "✨" },
  offer:    { label: "Offer",   emoji: "🏷️" },
  shampoo:  { label: "Shampoo", emoji: "🧴" },
  massage:  { label: "Massage", emoji: "💆" },
  indo:     { label: "Indo",    emoji: "🌿" },
  star:     { label: "Star",    emoji: "⭐" },
  flower:   { label: "Flower",  emoji: "🌸" },
  scissors: { label: "Cut",     emoji: "✂️" },
  nail:     { label: "Nail",    emoji: "💅" },
  fire:     { label: "Hot",     emoji: "🔥" },
} as const;

export type PackageIconKey = keyof typeof PACKAGE_ICONS;
