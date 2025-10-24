'use client';

import { SessionProvider, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function SessionWrapper({ session, children }) {
  return <SessionProvider session={session}>
    <AuthGuard>{children}</AuthGuard></SessionProvider>;
}

function AuthGuard({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const protectedRoutes = [
    /*/^\/admin(\/.*)?$/,
    /^\/community\/personal-space(\/.*)?$/,
    /^\/community\/query-tool(\/.*)?$/,
    /^\/community\/search$/,
    /^\/community\/search\/.*$/,
    /^\/me(\/.*)?$/*/
  ];

  const isProtectedRoute = protectedRoutes.some(route => route.test(pathname));

  useEffect(() => {
    if (isProtectedRoute && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router, isProtectedRoute]);

  if (isProtectedRoute && status === "loading") {
    return '';
  }

  if (isProtectedRoute && status === "unauthenticated") {
    return '';
  }

  return children;
}