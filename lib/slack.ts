import "server-only";

/**
 * Server-only Slack notifier for quiz lead milestones. Posts via the Web API
 * (chat.postMessage) — NOT an incoming webhook — because threading needs the
 * returned message `ts` to reply against. The first milestone of a session
 * posts the parent message; the rest reply in that thread (see /api/lead, which
 * stores the parent ts on leads.slack_thread_ts).
 *
 * Null/skip when unconfigured, so the funnel keeps working without credentials
 * (mirrors the Supabase/PostHog/Meta fail-safe). NEVER import from a client
 * component — the bot token must never reach the browser.
 */
const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;

export const slackConfigured = Boolean(token && channel);

/** The four funnel milestones we ping on. */
export type LeadEvent =
  | "quiz_started"
  | "q1_answered"
  | "email_given"
  | "download_clicked";

const EVENTS = new Set<LeadEvent>([
  "quiz_started",
  "q1_answered",
  "email_given",
  "download_clicked",
]);

export function isLeadEvent(v: unknown): v is LeadEvent {
  return typeof v === "string" && EVENTS.has(v as LeadEvent);
}

/** Subset of the leads row the messages read from. */
export interface LeadRow {
  session_id: string;
  booking_method?: string | null;
  other_system?: string | null;
  headache?: string | null;
  handle?: string | null;
  email?: string | null;
  fbclid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  download_store?: string | null;
  slack_thread_ts?: string | null;
}

const bookingLabel = (method?: string | null, other?: string | null): string => {
  switch (method) {
    case "dms":
      return "DMs / texts 💬";
    case "booksy":
      return "Booksy 📅";
    case "fresha":
      return "Fresha 💆";
    case "paper":
      return "Paper diary / notebook 📒";
    case "other":
      return other ? `Other ✍️ — ${other}` : "Other ✍️";
    default:
      return method ?? "—";
  }
};

const storeLabel = (store?: string | null): string => {
  switch (store) {
    case "ios":
      return "iOS 🍎";
    case "android":
      return "Android 🤖";
    default:
      return store ?? "unknown device";
  }
};

const shortSession = (id: string): string => (id.length > 8 ? id.slice(0, 8) : id);

// One context line summarising whatever UTM attribution rode in on the URL.
// Skips any param that's blank, returns null when there's nothing to show.
const UTM_FIELDS: readonly [keyof LeadRow, string][] = [
  ["utm_source", "source"],
  ["utm_medium", "medium"],
  ["utm_campaign", "campaign"],
  ["utm_content", "content"],
  ["utm_term", "term"],
];

const utmLine = (row: LeadRow): string | null => {
  const parts = UTM_FIELDS.filter(([key]) => row[key]).map(
    ([key, label]) => `*${label}:* \`${row[key]}\``,
  );
  return parts.length ? `:dart: ${parts.join(" · ")}` : null;
};

type Block = Record<string, unknown>;

interface Message {
  text: string; // notification/fallback text
  blocks: Block[];
}

const section = (text: string): Block => ({
  type: "section",
  text: { type: "mrkdwn", text },
});

const context = (text: string): Block => ({
  type: "context",
  elements: [{ type: "mrkdwn", text }],
});

function buildMessage(event: LeadEvent, row: LeadRow): Message {
  switch (event) {
    case "quiz_started": {
      const meta = row.fbclid ? " · 📣 from a Meta ad" : "";
      const blocks: Block[] = [
        section(":wave: *New quiz session started*"),
        context(`\`${shortSession(row.session_id)}\`${meta}`),
      ];
      const utm = utmLine(row);
      if (utm) blocks.push(context(utm));
      return { text: "🟢 New quiz session started", blocks };
    }
    case "q1_answered": {
      const label = bookingLabel(row.booking_method, row.other_system);
      return {
        text: `1️⃣ Q1 answered — books via ${label}`,
        blocks: [section(`:one: *Books clients via:* ${label}`)],
      };
    }
    case "email_given": {
      const ctx: string[] = [];
      if (row.handle) ctx.push(`🔖 @${row.handle}`);
      if (row.headache) ctx.push(`pain: ${row.headache}`);
      const blocks: Block[] = [section(`:email: *Email captured* — \`${row.email}\``)];
      if (ctx.length) blocks.push(context(ctx.join(" · ")));
      return { text: `📧 Email captured — ${row.email}`, blocks };
    }
    case "download_clicked": {
      const store = storeLabel(row.download_store);
      return {
        text: `🎉 Tapped download (${store})`,
        blocks: [section(`:tada: *Tapped download* — ${store}`)],
      };
    }
  }
}

/**
 * Post a milestone to Slack. Replies in-thread when `row.slack_thread_ts` is
 * set; otherwise posts a fresh parent. Returns `{ ts }` ONLY when a new parent
 * was created, so the caller can persist it for later replies. Never throws —
 * failures are logged and swallowed so a Slack hiccup can't break a lead write.
 */
export async function postLeadNotification(
  event: LeadEvent,
  row: LeadRow,
): Promise<{ ts?: string }> {
  if (!slackConfigured) return {};

  const threadTs = row.slack_thread_ts ?? undefined;
  const { text, blocks } = buildMessage(event, row);

  try {
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        channel,
        text,
        blocks,
        ...(threadTs ? { thread_ts: threadTs } : {}),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      ts?: string;
      error?: string;
    };
    if (!json.ok) {
      console.error("[slack] chat.postMessage failed:", json.error ?? res.status);
      return {};
    }
    // Only the parent ts is worth persisting (replies thread under it).
    return threadTs ? {} : { ts: json.ts };
  } catch (err) {
    console.error("[slack] chat.postMessage threw:", err);
    return {};
  }
}
