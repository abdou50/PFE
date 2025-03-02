import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./ThemeToggle";
import LogoutButton from "./LogoutButton";

export function Navbar() {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex-1 max-w-md">
        <Input type="search" placeholder="Search..." />
      </div>
      <div className="flex items-center space-x-4">
        <ThemeToggle />
      </div>
      <div>
        <LogoutButton/>
      </div>
    </div>
  );
}