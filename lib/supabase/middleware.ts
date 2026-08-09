import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ENTERED_COOKIE,
  ENTERED_COOKIE_VALUE,
} from "@/lib/auth/entered-cookie";
import { supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

function redirectHomeToDashboard(
  request: NextRequest,
  sessionResponse: NextResponse,
): NextResponse {
  const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie);
  });
  return redirect;
}

function shouldRedirectEnteredHome(request: NextRequest): boolean {
  return (
    request.nextUrl.pathname === "/" &&
    request.cookies.get(ENTERED_COOKIE)?.value === ENTERED_COOKIE_VALUE
  );
}

/**
 * Refresh the Auth session cookies on each matched request.
 * Returning users (entered cookie) skip landing → /dashboard.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    if (shouldRedirectEnteredHome(request)) {
      return redirectHomeToDashboard(request, response);
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  if (shouldRedirectEnteredHome(request)) {
    return redirectHomeToDashboard(request, response);
  }

  return response;
}
