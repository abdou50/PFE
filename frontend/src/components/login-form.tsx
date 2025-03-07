"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });

      if (response.data.token) {
        // Save user data to localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("role", response.data.role || "undefined");
        localStorage.setItem("department", response.data.department || "undefined");
        localStorage.setItem("firstName", response.data.firstName || "undefined");
        localStorage.setItem("userId", response.data.userId || "undefined");

        // Role-based redirection according to the sidebar structure
        const userRole = response.data.role;
        setTimeout(() => {
          const rolePaths: Record<string, string> = {
            user: "/user-dashboard",
            guichetier: "/dashboard/view-reclamations",
            employee: "/dashboard/assign-tasks",
            admin: "/dashboard/manage-users",
            director: "/dashboard/view-reports",
          };

          router.push(rolePaths[userRole] || "/default-dashboard");
        }, 500);
      }
    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side with logo */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 items-center justify-center">
        <img src="/assets/cni.jpg" alt="CNI Logo" className="h-32" />
      </div>

      {/* Right side with form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Login</h1>
            <p className="text-sm text-gray-500">Enter your credentials to access your account</p>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
