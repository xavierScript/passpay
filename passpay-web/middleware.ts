import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware to protect premium routes.
 * Checks subscription status before allowing access.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect premium routes
  if (pathname.startsWith("/premium")) {
    // TODO: Check subscription status from cookie or query backend
    // For demo, allow access
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/premium/:path*"],
};
