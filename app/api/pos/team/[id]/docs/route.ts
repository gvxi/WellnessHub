import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyEmployee } from "@/lib/auth/verify-employee";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "employee-docs";

function anonClient() {
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function verifyMainAccess(request: NextRequest, targetUserId: string) {
  const ctx = await verifyEmployee(request);
  if (!ctx) return null;
  if (ctx.posUserType !== "main" || !ctx.canCreateSubUsers) return null;

  // Verify target is actually a sub user owned by this main user
  const { data } = await anonClient().rpc("pos_verify_sub_user_owner", {
    p_caller_user_id: ctx.userId,
    p_target_user_id: targetUserId,
    p_business_id: ctx.businessId,
  });
  if (!data) return null;

  return ctx;
}

// POST /api/pos/team/[id]/docs — upload contract or document for sub user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const ctx = await verifyMainAccess(request, targetUserId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;

  if (!file || !["contract", "document"].includes(type ?? "")) {
    return NextResponse.json({ error: "Missing file or invalid type" }, { status: 400 });
  }

  const timestamp = Date.now();
  const folder = type === "contract" ? "contract" : "documents";
  const path = `${targetUserId}/${folder}/${timestamp}-${safeName(file.name)}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await serviceClient()
    .storage.from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: type === "contract" });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  if (type === "contract") {
    await anonClient().rpc("set_employee_contract", { p_user_id: targetUserId, p_path: path });
  } else {
    await anonClient().rpc("add_employee_document", { p_user_id: targetUserId, p_path: path });
  }

  return NextResponse.json({ path });
}

// GET /api/pos/team/[id]/docs — signed URLs for sub user files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const ctx = await verifyMainAccess(request, targetUserId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rows } = await anonClient().rpc("get_employee_profile_paths", { p_user_id: targetUserId });
  const profile = rows?.[0] ?? null;

  if (!profile) return NextResponse.json({ contract: null, documents: [] });

  const sc = serviceClient();

  let contract: { path: string; url: string } | null = null;
  if (profile.contract_path) {
    const { data } = await sc.storage.from(BUCKET).createSignedUrl(profile.contract_path, 3600);
    if (data) contract = { path: profile.contract_path, url: data.signedUrl };
  }

  const docs = profile.document_paths ?? [];
  const documents: { path: string; url: string }[] = [];
  for (const docPath of docs) {
    const { data } = await sc.storage.from(BUCKET).createSignedUrl(docPath, 3600);
    if (data) documents.push({ path: docPath, url: data.signedUrl });
  }

  return NextResponse.json({ contract, documents });
}

// DELETE /api/pos/team/[id]/docs — remove a document from sub user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: targetUserId } = await params;
  const ctx = await verifyMainAccess(request, targetUserId);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { path, type } = body as { path: string; type?: string };

  if (!path) return NextResponse.json({ error: "Missing path" }, { status: 400 });

  await serviceClient().storage.from(BUCKET).remove([path]);

  if (type === "contract") {
    await anonClient().rpc("set_employee_contract", { p_user_id: targetUserId, p_path: null });
  } else {
    await anonClient().rpc("remove_employee_document", { p_user_id: targetUserId, p_path: path });
  }

  return NextResponse.json({ ok: true });
}
