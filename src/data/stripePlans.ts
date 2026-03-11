// Stripe product/price mapping for plan upgrades
export const STRIPE_PLANS = {
  premium_annual: {
    price_id: "price_1T8ncTBA2gyBJFRKKJlLkmF8",
    product_id: "prod_U71fHmvktOBUbq",
    name: "Premium (Annual)",
    amount: 49.99,
    mode: "subscription" as const,
    interval: "year",
  },
  premium_lifetime: {
    price_id: "price_1T8ndbBA2gyBJFRKV9TPxDjz",
    product_id: "prod_U71guBVwU3pjGw",
    name: "Premium (Lifetime)",
    amount: 99.99,
    mode: "payment" as const,
  },
  business_monthly: {
    price_id: "price_1T8nnqBA2gyBJFRK9VpYy7oN",
    product_id: "prod_U71rbrWJHacqKi",
    name: "Business (Monthly)",
    amount: 19.99,
    mode: "subscription" as const,
    interval: "month",
  },
  business_annual: {
    price_id: "price_1T8nf5BA2gyBJFRKmWSl8tnh",
    product_id: "prod_U71i7jaxAId6re",
    name: "Business (Annual)",
    amount: 199.99,
    mode: "subscription" as const,
    interval: "year",
  },
} as const;

export type PlanKey = keyof typeof STRIPE_PLANS;
