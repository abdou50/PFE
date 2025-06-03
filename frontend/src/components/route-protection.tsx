"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

type RouteProtectionProps = {
  children: ReactNode;
};

const roleRoutes = {
  user: ["/user-dashboard", "/user-dashboard/create-reclamation", "/user-dashboard/schedule-meeting", "/user-dashboard/track-reclamation", "/user-dashboard/guide"],
  guichetier: ["/guichetier-dashboard", "/guichetier-dashboard/manage-appointments"],
  employee: ["/employee-dashboard", "/employee-dashboard/manage-appointments"],
  admin: ["/admin-dashboard", "/admin-dashboard/departments", "/admin-dashboard/users", "/admin-dashboard/statistics"],
  director: ["/director-dashboard", "/director-dashboard/reports"]
};

export function RouteProtection({ children }: RouteProtectionProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const isPublicRoute = ["/login", "/register", "/access-denied"].includes(pathname);

    if (!role && !isPublicRoute) {
      router.push("/login");
      return;
    }

    if (role && !isPublicRoute) {
      const allowedRoutes = roleRoutes[role as keyof typeof roleRoutes] || [];
      const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));

      if (!hasAccess) {
        router.push("/access-denied");
      }
    }
  }, [pathname, router]);

  return <>{children}</>;
}