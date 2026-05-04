import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import SignOutButton from "../sign-out-button";
import EditPlanForm from "./edit-plan-form";

export default async function EditPlanPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900">Edit plan</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Upload key thumbnails from a shoot and a short brief. Get back a
            structured plan to drop into a Premiere timeline.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
          >
            Inquiries
          </Link>
          <SignOutButton />
        </div>
      </div>

      <EditPlanForm />
    </main>
  );
}
