
export const tiers = [
  {
    name: "Free",
    price: "$0",
    features: [
      "Basic journaling",
      " AI analyses per month",
      "Community support",
      "Basic flashcards",
    ],
    cta: "Get Started",
    priceId: null, // No price ID for free tier
  },
  {
    name: "Pro",
    price: "$5",
    features: [
      "Unlimited journaling",
      "10 AI analyses per day",
      "Priority support",
      "Advanced flashcards",
      "Progress tracking",
    ],
    cta: "Upgrade to Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  {
    name: "Expert",
    price: "$9",
    features: [
      "Everything in Pro",
      "Unlimited AI analyses",
      "24/7 premium support",
      "Personalized coaching",
      "Early access to features",
    ],
    cta: "Upgrade to Expert",
    priceId: process.env.STRIPE_EXPERT_PRICE_ID || null,
  },
];