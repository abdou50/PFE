"use client";

import { useState, useEffect } from "react";
import LogoutButton from "../components/LogoutButton";

export default function UserDashboard() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const [department, setDepartment] = useState<string | null>(null);

  useEffect(() => {
    const storedFirstName = localStorage.getItem("firstName");
    const storedDepartment = localStorage.getItem("department");

    console.log("📥 Retrieved from LocalStorage:");
    console.log("First Name:", storedFirstName);
    console.log("Department:", storedDepartment);

    setFirstName(storedFirstName);
    setDepartment(storedDepartment);
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">
        Welcome {firstName || "User"}, you are in the {department || "N/A"} department.
      </h1>
      <p className="text-muted-foreground">This is the User Dashboard.</p>
    </div>
  );
}
