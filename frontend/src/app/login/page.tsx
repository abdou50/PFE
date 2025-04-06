"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

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

        // Save ministre and service to localStorage if role is "user"
        if (response.data.role === "user") {
          if (response.data.ministre) {
            localStorage.setItem("ministre", response.data.ministre);
          }
          if (response.data.service) {
            localStorage.setItem("service", response.data.service);
          }
        } else {
          localStorage.removeItem("ministre");
          localStorage.removeItem("service");
        }

        // Redirect based on role
        if (response.data.role === "user") {
          router.push("/user-dashboard");
        } else if (response.data.role === "guichetier") {
          router.push("/guichetier-dashboard")

        }

      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Email ou mot de passe incorrect.");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 bg-background p-8 rounded-lg shadow-lg border border-border">
        {/* Small Logo */}
        <div className="flex justify-center">
          <Image
            src="/assets/cni1.png"
            alt="Logo CNI"
            width={100}
            height={100}
            className="object-contain"
          />
        </div>

        {/* Form Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Connexion</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Nous vous aidons à résoudre votre réclamation !
          </p>
        </div>

        {/* Error Message */}
        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Adresse e-mail
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Entrez votre email"
                className="h-12 text-lg"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
                className="h-12 text-lg"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-lg"
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
}