import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Public routes that do not require auth
const publicRoutes = [
  "/login",
  "/api/health",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow Next internals and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/assets") ||
    pathname.match(/\.(?:js|css|svg|png|jpg|jpeg|gif|webp|ico|txt)$/)
  ) {
    return NextResponse.next()
  }

  // Let all API routes be handled by route handlers themselves (they do auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // Allow public routes and NextAuth routes
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req })
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("from", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next|favicon|assets|api).*)",
  ],
}
