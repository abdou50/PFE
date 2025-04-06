"use client"; // Ensure this is a client component

import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { LogOut, Search } from "lucide-react"; // Import icons from Lucide
import { useRouter } from "next/navigation"; // For routing
import { useState } from "react"; // For search input state

export function Navbar() {
  const router = useRouter(); // Initialize the router
  const [isSearchOpen, setIsSearchOpen] = useState(false); // State for search input

  const handleLogout = () => {
    // Clear localStorage items
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("department");
    localStorage.removeItem("name");

    // Redirect to the login page
    router.push("/login");
  };

  return (
    <div className="flex items-center justify-between p-4 border-b">
      {/* Search Input */}
      <div className="flex items-center space-x-4">
        {/* Search Icon (visible when search input is closed) */}
        {!isSearchOpen && (
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <Search className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        {/* Search Input (expands when clicked) */}
        {isSearchOpen && (
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search..."
              autoFocus // Automatically focus the input when it opens
              className="w-48 transition-all duration-300 ease-in-out" // Smooth transition
              onBlur={() => setIsSearchOpen(false)} // Close search when input loses focus
            />
          </div>
        )}
      </div>

      {/* Theme Toggle and Avatar */}
      <div className="flex items-center space-x-4">
        <ThemeToggle />

        {/* Avatar with Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 focus:outline-none">
              <Avatar className="h-10 w-10">
                {/* Use the avatar image from public/assets */}
                <AvatarImage src="/assets/avatar.jpg" alt="User Avatar" />
                <AvatarFallback>U</AvatarFallback> {/* Fallback if no image */}
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 mt-2">
            <DropdownMenuItem
              onClick={handleLogout} // Call the logout function
              className="cursor-pointer text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" /> {/* Logout Icon */}
              <span>Quittez</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}