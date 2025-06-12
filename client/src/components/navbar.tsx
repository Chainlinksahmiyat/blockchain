import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Home, 
  Users, 
  Coins, 
  Bell, 
  Search,
  Box
} from "lucide-react";
import type { User } from "@shared/schema";

interface NavbarProps {
  user?: User;
}

export default function Navbar({ user }: NavbarProps) {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Search */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-facebook-blue to-blockchain-accent rounded-full flex items-center justify-center">
                <Box className="text-white text-lg" />
              </div>
              <span className="text-xl font-bold text-[hsl(213,89%,52%)]">BlockSocial</span>
            </div>
            <div className="relative ml-6 hidden md:block">
              <Input
                type="text"
                placeholder="Search BlockSocial..."
                className="w-64 pl-10 bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-[hsl(213,89%,52%)] focus:bg-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-8">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-[hsl(213,89%,52%)] bg-blue-50 hover:bg-blue-100"
            >
              <Home className="text-xl" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-[hsl(214,8%,40%)] hover:text-[hsl(213,89%,52%)] hover:bg-gray-100"
            >
              <Users className="text-xl" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-[hsl(214,8%,40%)] hover:text-[hsl(213,89%,52%)] hover:bg-gray-100"
            >
              <Coins className="text-xl" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 text-[hsl(214,8%,40%)] hover:text-[hsl(213,89%,52%)] hover:bg-gray-100"
            >
              <Bell className="text-xl" />
            </Button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="bg-[hsl(186,100%,38%)] text-white px-3 py-1 rounded-full text-sm font-semibold">
              <Coins className="inline h-4 w-4 mr-1" />
              <span>{user?.coinBalance?.toLocaleString() || '0'} AC</span>
            </div>
            <div className="relative group">
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"}
                alt="User Profile" 
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-[hsl(213,89%,52%)]"
              />
              <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-2 hidden group-hover:block min-w-48">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-text-secondary">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
