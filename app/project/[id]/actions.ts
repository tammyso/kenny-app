"use server";

import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

export async function submitProjectMessage(args: {
  inquiryId: string;
  senderName: string;
  message: string;
}) {
  if (!args.senderName.trim() || !args.message.trim()) {
    throw new Error("Name and message are required.");
  }
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("project_messages").insert({
    inquiry_id: args.inquiryId,
    sender_name: args.senderName.trim(),
    message: args.message.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/project/${args.inquiryId}`);
}
