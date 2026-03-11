export interface TributeTier {
  id: string;
  tier: "base" | "standard" | "premium";
  name: string;
  icon: string;
  price: number;
  description: string;
  animated: boolean;
  duration?: string;
}

export const tributeTiers: TributeTier[] = [
  {
    id: "base",
    tier: "base",
    name: "Message",
    icon: "✉️",
    price: 0,
    description: "Leave a condolence message",
    animated: false,
  },
  {
    id: "standard-candle",
    tier: "standard",
    name: "Candle",
    icon: "🕯️",
    price: 2,
    description: "A candle lit in memory",
    animated: false,
  },
  {
    id: "standard-flower",
    tier: "standard",
    name: "Flowers",
    icon: "🌹",
    price: 2,
    description: "A floral tribute",
    animated: false,
  },
  {
    id: "premium-candle",
    tier: "premium",
    name: "Eternal Candle",
    icon: "🕯️",
    price: 5,
    description: "Stays at the top of the guestbook for 30 days",
    animated: true,
    duration: "30 days",
  },
];
