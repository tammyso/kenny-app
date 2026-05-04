"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { KENNY_EDIT_PLAN_SYSTEM_PROMPT } from "@/lib/prompts";

const requireUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");
};

export type EditPlanImage = {
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  base64: string;
};

export async function generateEditPlan(args: {
  brief: string;
  projectType: string;
  targetLength: string;
  vibe: string;
  images: EditPlanImage[];
}): Promise<string> {
  await requireUser();

  if (!args.brief.trim()) throw new Error("Brief is required");
  if (args.images.length === 0) throw new Error("Add at least one thumbnail");
  if (args.images.length > 12) {
    throw new Error("Max 12 thumbnails per plan for now");
  }

  const userContent: Anthropic.ContentBlockParam[] = [];
  args.images.forEach((img, i) => {
    userContent.push({ type: "text", text: `Thumbnail ${i + 1}:` });
    userContent.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.base64 },
    });
  });
  userContent.push({
    type: "text",
    text: [
      "",
      "Brief:",
      args.brief.trim(),
      "",
      `Project type: ${args.projectType.trim() || "not specified"}`,
      `Target length: ${args.targetLength.trim() || "not specified"}`,
      `Vibe / energy: ${args.vibe.trim() || "not specified"}`,
      "",
      "Generate a structured edit plan.",
    ].join("\n"),
  });

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 2048,
    system: [
      {
        type: "text",
        text: KENNY_EDIT_PLAN_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userContent }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  if (!text) throw new Error("Claude returned an empty plan");
  return text;
}
