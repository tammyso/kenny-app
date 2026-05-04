import Anthropic from "@anthropic-ai/sdk";

export type TriageTag = "clean" | "low_value" | "flagged";

export type TriageResult = {
  tag: TriageTag;
  reason: string;
};

const TRIAGE_PROMPT = `You are triaging a videographer's inbound inquiries to surface red flags, not to filter out real leads. Bias toward "clean" — only escalate when patterns are clear.

Classify as:
- "flagged": shows scam patterns. Examples — cashier's check / wire transfer offered up front, asks Kenny to send money first, foreign event with US payment, urgent vague language with no specifics, generic copy-paste, mismatched names/emails.
- "low_value": almost certainly won't book at Kenny's rates — budget under $1k for non-trivial work, one-line message with no specifics, hostile or unrealistic tone.
- "clean": everything else, including legitimate inquiries even if details are thin.

Respond ONLY with strict JSON: {"tag": "clean" | "low_value" | "flagged", "reason": "<one sentence>"}`;

export async function triageInquiry(args: {
  clientName: string;
  clientEmail: string;
  projectType: string | null;
  budgetRange: string | null;
  message: string | null;
}): Promise<TriageResult> {
  const userMessage = [
    `Name: ${args.clientName}`,
    `Email: ${args.clientEmail}`,
    `Project type: ${args.projectType ?? "not specified"}`,
    `Budget: ${args.budgetRange ?? "not specified"}`,
    "",
    "Message:",
    args.message?.trim() || "(no message)",
  ].join("\n");

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    system: TRIAGE_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  // Permissive parse: find the first {...} object in the response. Fall back
  // to "clean" on any failure — better to miss a flag than to incorrectly
  // bury a legitimate inquiry behind triage.
  try {
    const match = /\{[\s\S]*?\}/.exec(text);
    if (!match) throw new Error("No JSON object in response");
    const parsed = JSON.parse(match[0]) as { tag?: string; reason?: string };
    const tag = parsed.tag;
    if (tag !== "clean" && tag !== "low_value" && tag !== "flagged") {
      throw new Error(`Invalid tag: ${tag}`);
    }
    return { tag, reason: String(parsed.reason ?? "").trim() };
  } catch (err) {
    console.error("Triage parse failed:", err, "raw:", text);
    return { tag: "clean", reason: "" };
  }
}
