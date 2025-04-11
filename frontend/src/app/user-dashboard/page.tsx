"use client";

import { useEffect, useState } from "react";
import ListeDeRequetes from "../components/usertable/ListeDeRequetes";
import { useRouter } from "next/navigation";

export default function UserDashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
      return;
    }
    setUserId(storedUserId);
  }, [router]);

  if (!userId) {
    return null;
  }

  return <ListeDeRequetes userId={userId} />;
}