import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Startup health check for encryption key
  if (!process.env.APP_ENCRYPTION_KEY) {
    console.error(
      "FATAL: APP_ENCRYPTION_KEY is not defined. Application cannot start securely.",
    );
    return new NextResponse("Server configuration error.", { status: 500 });
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Construct and set the final CSP header
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    media-src 'self' data:;
    connect-src 'self';
    font-src 'self';
    worker-src 'self' blob:;
    object-src 'none';
    frame-src 'none';
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