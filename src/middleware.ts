import { NextResponse, type NextRequest } from "next/server";

/**
 * The root layout owns <html lang>, and a layout cannot read the pathname on
 * its own. Passing it through as a header lets the language be decided on the
 * server, so the correct lang attribute is in the initial HTML rather than
 * patched in afterwards.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|pdf|audio).*)"],
};
