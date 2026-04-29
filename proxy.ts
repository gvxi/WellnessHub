import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/zw0/dashboard")) {
    const token = request.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/zw0", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/zw0/dashboard/:path*"],
};
