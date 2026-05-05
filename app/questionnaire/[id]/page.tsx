import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import QuestionnaireForm from "./questionnaire-form";

type QuestionnaireData = {
  id: string;
  client_name: string;
  project_type: string | null;
  event_date: string | null;
  status: string | null;
  pre_shoot_responses: Record<string, string> | null;
  pre_shoot_completed_at: string | null;
};

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const { data: inquiry } = await supabase
    .from("inquiries")
    .select(
      "id, client_name, project_type, event_date, status, pre_shoot_responses, pre_shoot_completed_at",
    )
    .eq("id", id)
    .maybeSingle<QuestionnaireData>();

  if (!inquiry || inquiry.status !== "booked") {
    notFound();
  }

  if (inquiry.pre_shoot_completed_at) {
    return (
      <div className="min-h-screen bg-zinc-950">
        <main className="mx-auto w-full max-w-2xl px-6 py-16">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-8">
            <h1 className="text-2xl font-semibold text-zinc-50">
              Thanks — we&apos;re all set
            </h1>
            <p className="mt-3 text-sm text-zinc-300">
              You filled this out on{" "}
              {new Date(inquiry.pre_shoot_completed_at).toLocaleDateString()}.
              If something changes, reply to Kenny&apos;s last email and
              he&apos;ll update it on his end.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <main className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">
            Pre-shoot details
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-50">
            {inquiry.client_name}
          </h1>
          <p className="mt-3 text-base text-zinc-300">
            A few logistics so the day runs smoothly. Takes about 3 minutes.
          </p>
        </div>
        <QuestionnaireForm
          inquiryId={inquiry.id}
          projectType={inquiry.project_type}
        />
      </main>
    </div>
  );
}
