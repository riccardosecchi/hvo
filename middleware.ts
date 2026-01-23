import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if it's an admin route
  const isAdminRoute = pathname.includes("/admin");
  const isLoginRoute = pathname.includes("/admin/login");
  const isRegisterRoute = pathname.includes("/admin/register");

  if (isAdminRoute && !isLoginRoute && !isRegisterRoute) {
    const { supabaseResponse, user } = await updateSession(request);

    if (!user) {
      // Extract locale from pathname
      const locale = pathname.split("/")[1] || "it";
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Apply intl middleware and merge cookies
    const intlResponse = intlMiddleware(request);

    // Copy Supabase cookies to intl response
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      intlResponse.cookies.set(cookie.name, cookie.value, cookie);
    });

    // Add pathname header for layout to detect admin routes
    intlResponse.headers.set("x-pathname", pathname);

    return intlResponse;
  }

  // For non-admin routes, just apply intl middleware
  const response = intlMiddleware(request);

  // Add pathname header for layout
  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: ["/", "/(it|en)/:path*"],
};

