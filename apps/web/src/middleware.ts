import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protéger /admin/dashboard avec un cookie httpOnly signé par le serveur
  if (pathname.startsWith("/admin/dashboard")) {
    const adminToken = request.cookies.get("admin_session")?.value;
    const secret = process.env.ADMIN_SESSION_SECRET;
    // Fail closed : sans secret configuré (ou sans cookie), on refuse l'accès
    if (!secret || secret.length < 16 || !adminToken || adminToken !== secret) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
