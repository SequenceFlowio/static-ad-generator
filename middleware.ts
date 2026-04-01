import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TRIAL_DAYS = 7;
const WHITELISTED_EMAILS = ["sequenceflownl@gmail.com"];

// Routes that must stay accessible even after trial expires
function isTrialExempt(pathname: string): boolean {
  if (pathname === "/trial-ended") return true;
  if (pathname.startsWith("/api/stripe/")) return true; // checkout/webhook/portal must work
  if (pathname.startsWith("/auth/")) return true;
  if (pathname === "/login") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute =
    pathname === "/login" || pathname.startsWith("/auth/");

  if (!user && !isAuthRoute) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Already logged in — don't show login page
  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Server-side trial enforcement — cannot be bypassed via DevTools
  if (user && !isAuthRoute && !isTrialExempt(pathname)) {
    const email = user.email ?? "";
    const isWhitelisted = WHITELISTED_EMAILS.includes(email);

    if (!isWhitelisted) {
      const createdAt = new Date(user.created_at);
      const daysElapsed = Math.floor(
        (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysElapsed >= TRIAL_DAYS) {
        // Query subscription status directly — no client-side trust
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .single();

        const hasActiveSub = sub?.status === "active" || sub?.status === "trialing";

        if (!hasActiveSub) {
          if (pathname.startsWith("/api/")) {
            return NextResponse.json(
              { error: "Trial expired. Please upgrade to continue.", code: "TRIAL_EXPIRED" },
              { status: 402 }
            );
          }
          return NextResponse.redirect(new URL("/trial-ended", request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo-black.png|logo-white.png|template thumbnails|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
