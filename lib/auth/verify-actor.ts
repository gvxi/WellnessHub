import { NextRequest } from "next/server";
import { verifyEmployee } from "./verify-employee";
import { verifyAdmin } from "./verify-admin";

export type ActorContext = {
  businessId: string;
  userId: string;
  isAdmin: boolean;
  email: string;
  fullName: string | null;
  posUserType: "main" | "sub";
  parentEmail: string | null;
};

export async function verifyActor(request: NextRequest): Promise<ActorContext | null> {
  const emp = await verifyEmployee(request);
  if (emp) {
    return {
      businessId: emp.businessId,
      userId: emp.userId,
      isAdmin: false,
      email: emp.email,
      fullName: emp.fullName,
      posUserType: emp.posUserType,
      parentEmail: emp.parentEmail,
    };
  }

  const admin = await verifyAdmin(request);
  if (admin) {
    return {
      businessId: admin.businessId,
      userId: admin.userId,
      isAdmin: true,
      email: "",
      fullName: null,
      posUserType: "main",
      parentEmail: null,
    };
  }

  return null;
}
