import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyEmployeeFromCookies } from "@/lib/auth/verify-employee";
import PosModeClient from "./PosModeClient";

export default async function PosModePage() {
  const cookieStore = await cookies();
  const ctx = await verifyEmployeeFromCookies(cookieStore);

  if (!ctx) redirect("/pos");

  return (
    <PosModeClient
      permissions={ctx.permissions}
      employeeEmail={ctx.email}
    />
  );
}
