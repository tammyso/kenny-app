import Anthropic from "@anthropic-ai/sdk";

// Personal email providers — skip research because the domain isn't the
// client's brand. Saves wasted fetches (and avoids summarizing gmail.com).
const PERSONAL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "icloud.com",
  "live.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "me.com",
  "mac.com",
  "msn.com",
]);

const FETCH_TIMEOUT_MS = 5000;
const MAX_TEXT_CHARS = 10000;

const RESEARCH_PROMPT = `You're briefing Kenny (a videographer) on a brand client who just submitted an inquiry, based on the text content of their website. Stick to what's grounded in the page — don't speculate about budget or guess at things the page doesn't say.

Write 3-5 sentences covering:
- What the brand does and who their audience is
- Their current visual / content style if it's evident
- What kind of video work might fit (retainer-friendly weekly content, hero campaign, brand film, etc.)
- Anything notable Kenny would want to reference in his reply

Don't quote the website at length. Don't include the word "summary" or section headers — just write the paragraph.`;

export async function researchClient(args: {
  clientName: string;
  clientEmail: string;
}): Promise<string | null> {
  const domain = args.clientEmail.split("@")[1]?.trim().toLowerCase();
  if (!domain || PERSONAL_DOMAINS.has(domain)) return null;

  const url = `https://${domain}`;

  let html: string;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; KennyApp/1.0; +https://kenny-app-five.vercel.app)",
      },
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    html = await response.text();
  } catch (err) {
    console.error(`Client research fetch failed for ${url}:`, err);
    return null;
  }

  // Strip script/style blocks, then all tags, then collapse whitespace.
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT_CHARS);

  if (text.length < 200) return null;

  const claude = new Anthropic();
  const response = await claude.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: RESEARCH_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          `Brand: ${args.clientName}`,
          `Website: ${url}`,
          "",
          "Page text content:",
          text,
        ].join("\n"),
      },
    ],
  });

  const summary = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return summary || null;
}
