import { Sidebar } from "../components/Sidebar"
import { Navbar } from "../components/Navbar";
import { ThemeProvider  } from "next-themes";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem></ThemeProvider>
        {children}
        </div>
      </div>
    </div>
  );
}