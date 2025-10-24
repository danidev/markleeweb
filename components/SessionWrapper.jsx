'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const PUBLIC_ROUTES = ["/login", "/logout", "/register"];

export default function SessionWrapper({ session, children }) {
  return <SessionProvider session={session}>
    <AuthGuard>{children}</AuthGuard></SessionProvider>;
}

function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Only /login, /logout, and /register are public, everything else is protected
  
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!isPublicRoute && status === "unauthenticated") {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, isPublicRoute, pathname]);

  if (!isPublicRoute && status === "loading") {
    return '';
  }

  if (!isPublicRoute && status === "unauthenticated") {
    return '';
  }

  return children;
}