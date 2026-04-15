import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "supascale_session";

function getSecret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || "development-only-change-me");
}

const publicPaths = new Set(["/login", "/setup"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/setup") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  if (publicPaths.has(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    await jwtVerify(token, getSecret());
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
