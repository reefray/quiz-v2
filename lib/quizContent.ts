/**
 * Quiz content + branching data. Copy is the source of truth from
 * barbr-quiz-copy-UPDATED.md. Drives the funnel:
 *   booking method → (branch) headache list → (per-headache) reveal copy.
 * Track logic: DMs + Pen/paper = DM track · Booksy + Fresha + Other = competitor.
 */

export interface BookingMethod {
  id: string;
  label: string;
  sub: string;
  emoji: string;
}

export const BOOKING_METHODS: BookingMethod[] = [
  { id: "dms", label: "DMs & messages", sub: "Instagram, WhatsApp, texts", emoji: "💬" },
  { id: "booksy", label: "Booksy", sub: "On a booking app", emoji: "📲" },
  { id: "fresha", label: "Fresha", sub: "On a booking app", emoji: "🗓️" },
  { id: "paper", label: "Pen, paper or memory", sub: "No real system yet", emoji: "📝" },
  { id: "other", label: "Other", sub: "Another app or system", emoji: "➕" },
];

/** Booking methods that count as the competitor track. */
export const COMP_METHODS = ["booksy", "fresha", "other"];

export interface Headache {
  label: string;
  emoji: string;
}

/** Headache options — DM track. */
export const HEADACHES_DM: Headache[] = [
  { label: "No-shows & flakes", emoji: "👻" },
  { label: "Endless back-and-forth", emoji: "🔁" },
  { label: "Drowning in DMs", emoji: "🌊" },
  { label: "Looking unprofessional", emoji: "😬" },
  { label: "Empty gaps in my day", emoji: "🪑" },
  { label: "Want more new clients", emoji: "📈" },
];

/** Headache options — competitor track (Booksy / Fresha / Other). */
export const HEADACHES_COMP: Headache[] = [
  { label: "Commission on clients I found myself", emoji: "🧾" },
  { label: "Fees that keep creeping up", emoji: "💸" },
  { label: "Glitchy or clunky for clients", emoji: "🐛" },
  { label: "Pushing my clients to other barbers", emoji: "↪️" },
  { label: "No-shows & flakes", emoji: "👻" },
  { label: "Want more new clients", emoji: "📈" },
];

export interface Bullet {
  emoji: string;
  text: string;
}

export interface Reveal {
  title: string;
  bullets: Bullet[];
}

/** Per-headache "here's the fix" reveal copy, keyed by headache label. */
export const REVEAL: Record<string, Reveal> = {
  // ── Shared (appear on both tracks) ──
  "No-shows & flakes": {
    title: "Make no-shows pay",
    bullets: [
      { emoji: "💳", text: "Take a deposit when they book — flakes pay or they lose the slot" },
      { emoji: "🔔", text: "Automatic reminders so they actually turn up" },
      { emoji: "🔒", text: "Card on file means a no-show still pays for your time" },
    ],
  },
  "Want more new clients": {
    title: "Bring in better clients",
    bullets: [
      { emoji: "🎯", text: "A booking page built to turn lookers into bookings" },
      { emoji: "🔗", text: "One link made for every post, story and reel" },
      { emoji: "✨", text: "Show up clean when locals are deciding who to book" },
    ],
  },

  // ── DM track ──
  "Endless back-and-forth": {
    title: "Kill the back-and-forth",
    bullets: [
      { emoji: "🕐", text: "Clients book themselves, 24/7 — no \"you free Saturday?\" at 11pm" },
      { emoji: "✅", text: "Confirmations and reminders go out on their own" },
      { emoji: "💬", text: "Your DMs go back to being DMs, not a booking system" },
    ],
  },
  "Drowning in DMs": {
    title: "Get your DMs back",
    bullets: [
      { emoji: "🔗", text: "One link clients tap to book any open slot" },
      { emoji: "📅", text: "Bookings land in your calendar, not your inbox" },
      { emoji: "🔍", text: "Stop scrolling back through messages to piece your day together" },
    ],
  },
  "Looking unprofessional": {
    title: "Look like the brand you are",
    bullets: [
      { emoji: "✨", text: "A clean booking page with your work front and centre" },
      { emoji: "🔗", text: "Your own barbr.me link for your bio and stories" },
      { emoji: "💼", text: "Deposits and clear policies make you look serious from the first tap" },
    ],
  },
  "Empty gaps in my day": {
    title: "Fill the empty chair",
    bullets: [
      { emoji: "⚡", text: "Let clients grab last-minute slots the moment they open up" },
      { emoji: "🔁", text: "Rebooking prompts so regulars are back in 4 weeks" },
      { emoji: "📣", text: "Quiet day? Fill it without lifting a finger" },
    ],
  },

  // ── Competitor track ──
  "Commission on clients I found myself": {
    title: "Your clients are yours",
    bullets: [
      { emoji: "🆓", text: "Zero commission on the clients you bring — ever" },
      { emoji: "🚫", text: "No marketplace taking a cut of your own regulars" },
      { emoji: "🤝", text: "You own the relationship, not a platform" },
    ],
  },
  "Fees that keep creeping up": {
    title: "One flat price. No surprises.",
    bullets: [
      { emoji: "💷", text: "Flat £20/month — not a bill that creeps up" },
      { emoji: "🚫", text: "No new-client fees, no boost charges, nothing skimmed off the top" },
      { emoji: "💰", text: "Keep your prices, keep your money" },
    ],
  },
  "Glitchy or clunky for clients": {
    title: "Booking that just works",
    bullets: [
      { emoji: "👆", text: "Two taps to book — no account, no faff for your clients" },
      { emoji: "⚡", text: "Fast and reliable, so you never look disorganised mid-cut" },
      { emoji: "💬", text: "Fewer \"how do I book?\" messages landing on you" },
    ],
  },
  "Pushing my clients to other barbers": {
    title: "No competitors on your page",
    bullets: [
      { emoji: "🙅", text: "Your page shows you — not a feed of other barbers nearby" },
      { emoji: "🎯", text: "Clients land on your brand and book you, full stop" },
      { emoji: "🔒", text: "No platform quietly sending your clients elsewhere" },
    ],
  },
};

/** Free-transfer card body (competitor track only). */
export const TRANSFER_BODY =
  "We'll move your clients, services and reviews across for free — usually within 24 hours. No re-entering anything by hand, and you don't lose your setup.";

/**
 * Switcher migration-screen copy (A/B test `switcher-migration-screen`,
 * Booksy/Fresha only). `platform` = 'Booksy' | 'Fresha'.
 */
export const MIGRATION = {
  eyebrow: "Easy switch",
  headline: (platform: string) => `We'll import all your data from ${platform} within 24 hours.`,
  rows: (platform: string): Bullet[] => [
    { emoji: "👥", text: "Your full client list — names, numbers, history" },
    { emoji: "📅", text: "Every upcoming booking, exactly as scheduled" },
    { emoji: "⭐", text: `All your ${platform} reviews and ratings, carried over` },
  ],
  review: {
    quote: (platform: string) =>
      `I switched to Barbr and the migration was seamless. They imported my entire client list from ${platform} in minutes — best decision for my business!`,
    name: "James K.",
    meta: "Barber · South London",
  },
  cta: "Continue",
} as const;

/** Handles already taken (demo availability check). */
export const TAKEN = ["barber", "fades", "admin", "test", "barbr"];

export interface Promo {
  id: number;
  label: string;
  gradient: string; // Tailwind gradient classes
}

/**
 * Promo-pack placeholders for the gift screen (real images uploaded later).
 * Same portrait story ratio; varied tints.
 */
export const PROMOS: Promo[] = [
  { id: 1, label: "Now booking", gradient: "from-brand-green to-brand-greenDark" },
  { id: 2, label: "Fresh cuts", gradient: "from-[#0f2a1c] to-[#06140d]" },
  { id: 3, label: "Slots are live", gradient: "from-brand-mint to-brand-deep" },
  { id: 4, label: "New clients", gradient: "from-[#1b1b1f] to-[#0a0a0c]" },
  { id: 5, label: "Tap to book", gradient: "from-[#34d399] to-[#0f766e]" },
];
