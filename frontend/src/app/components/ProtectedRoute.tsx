"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Debugging: Log the token and role
    console.log("ProtectedRoute - Token:", token);
    console.log("ProtectedRoute - Role:", role);

    if (!token || !role || !allowedRoles.includes(role)) {
      console.log("Redirecting to login...");
      router.push("/login");
    }
  }, [router, allowedRoles]);

  return <>{children}</>;
}