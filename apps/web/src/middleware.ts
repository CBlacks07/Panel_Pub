import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protéger /admin/dashboard avec un cookie httpOnly signé par le serveur
  if (pathname.startsWith("/admin/dashboard")) {
    const adminToken = request.cookies.get("admin_session")?.value;
    if (adminToken !== process.env.ADMIN_SESSION_SECRET) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
