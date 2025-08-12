import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Startup health check for encryption key
  if (!process.env.APP_ENCRYPTION_KEY) {
    console.error(
      "FATAL: APP_ENCRYPTION_KEY is not defined. Application cannot start securely.",
    );
    return new NextResponse("Server configuration error.", { status: 500 });
  }

  // NOTE: Nonce logic has been removed as it conflicts with 'unsafe-inline' needed by libraries.
  // We will rely on a host-based policy, which is a common and secure practice for Next.js apps.

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrlEnv = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrlEnv || !supabaseAnonKey) {
    console.error("Supabase environment variables are missing!");
    return NextResponse.redirect(
      new URL("/error?message=Supabase configuration missing", request.url),
    );
  }

  const supabase = createServerClient(supabaseUrlEnv, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/journal",
    "/study",
    "/translator",
    "/settings",
    "/admin",
  ];

  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("error", "Please log in to access this page.");
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    response = NextResponse.redirect(redirectUrl);
  } else if (user && isAuthRoute) {
    const redirectedFrom = request.nextUrl.searchParams.get("redirectedFrom");
    const redirectTo =
      redirectedFrom && redirectedFrom.startsWith("/")
        ? redirectedFrom
        : "/dashboard";
    response = NextResponse.redirect(new URL(redirectTo, request.url));
  }

  // Construct and set the final CSP header
  const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const sentryHost = sentryDsn ? new URL(sentryDsn).host : "";

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://*.posthog.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    media-src 'self' data:;
    connect-src 'self' ${supabaseUrl.origin} wss://${supabaseUrl.host} ${
      sentryHost ? `https://${sentryHost}` : ""
    } https://*.posthog.com https://vitals.vercel-insights.com;
    font-src 'self';
    worker-src 'self' blob:;
    object-src 'none';
    frame-src https://js.stripe.com https://hooks.stripe.com;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `;
  const cspHeaderValue = cspHeader.replace(/\s{2,}/g, " ").trim();
  response.headers.set("Content-Security-Policy", cspHeaderValue);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};