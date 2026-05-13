import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isCalendarConnected } from "@/lib/google";
import AppShell from "../app-shell";
import EditPlanForm from "./edit-plan-form";
import { getBookedInquiries } from "./actions";

export default async function EditPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ inquiry_id?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const calendarConnected = await isCalendarConnected();
  const params = await searchParams;
  const bookedInquiries = await getBookedInquiries();

  return (
    <AppShell calendarConnected={calendarConnected}>
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900">Template Planner</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Upload key thumbnails from a shoot and a short brief. Get back a
            structured plan to drop into a Premiere timeline.
          </p>
        </div>

        <EditPlanForm
          bookedInquiries={bookedInquiries}
          initialInquiryId={params.inquiry_id ?? null}
        />
      </div>
    </AppShell>
  );
}
