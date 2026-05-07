import { NextRequest, NextResponse } from "next/server";

const POS_HOST = "pos.wellnesshubom.com";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // Rewrite subdomain → /pos/*
  if (host === POS_HOST || host.startsWith("pos.wellnesshubom.")) {
    if (!pathname.startsWith("/pos")) {
      const url = request.nextUrl.clone();
      url.pathname = `/pos${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Guard /pos/dashboard — cookie presence check only (full validation in page/layout)
  if (pathname.startsWith("/pos/dashboard")) {
    if (!request.cookies.get("pos-token")) {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
  }

  // Guard /zw0/dashboard
  if (pathname.startsWith("/zw0/dashboard")) {
    const token = request.cookies.get("admin-token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/zw0", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/zw0/dashboard/:path*",
    "/pos/:path*",
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
