import React, { ReactNode, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Map,
  Truck,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      active: router.pathname === "/dashboard",
    },
    {
      label: "Users",
      href: "/users",
      icon: <Users className="h-5 w-5" />,
      active: router.pathname.startsWith("/users"),
    },
    {
      label: "Trackers",
      href: "/trackers",
      icon: <Map className="h-5 w-5" />,
      active: router.pathname.startsWith("/trackers"),
    },
    {
      label: "Recovery",
      href: "/recovery",
      icon: <Truck className="h-5 w-5" />,
      active: router.pathname.startsWith("/recovery"),
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />,
      active: router.pathname.startsWith("/settings"),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar for desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-primary-800 text-white transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-primary-700">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center">
                <span className="text-primary-700 font-bold">F</span>
              </div>
              <span className="text-lg font-semibold">FIND Admin</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 rounded-md text-primary-200 hover:text-white hover:bg-primary-700"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-2">
              {navigationItems.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className={`flex items-center rounded-md px-4 py-2.5 transition-colors ${
                      item.active
                        ? "bg-primary-700 text-white"
                        : "text-primary-100 hover:bg-primary-700"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sidebar footer with user profile */}
          <div className="border-t border-primary-700 p-4">
            <div className="flex items-center">
              <div className="relative h-10 w-10 rounded-full bg-primary-600 overflow-hidden">
                {user?.email && (
                  <div className="flex h-full w-full items-center justify-center text-white font-semibold">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Admin</p>
                <p className="text-xs text-primary-200 truncate max-w-[164px]">
                  {user?.email || "admin@find.com"}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="ml-auto p-1 rounded-md text-primary-200 hover:text-white hover:bg-primary-700"
                title="Log out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex h-16 items-center justify-between px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 rounded-md text-gray-500 md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4 ml-auto">
              {/* Notification bell removed - no notification system implemented */}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;