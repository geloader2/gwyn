"use client"

import { Outlet, Link, useLocation, Navigate } from "react-router-dom"
import { Calendar, Users, Briefcase, UserCircle, LayoutDashboard, Menu, X, LogOut, DollarSign } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { ProfileDialog } from "@/components/dialogs/ProfileDialog"

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/dashboard/appointments", label: "Appointments", icon: Calendar },
  { path: "/dashboard/clients", label: "Clients", icon: Users, adminStaffOnly: true },
  { path: "/dashboard/services", label: "Services", icon: Briefcase },
  { path: "/dashboard/staff", label: "Staff", icon: UserCircle, adminOnly: true },
  { path: "/dashboard/sales", label: "Sales", icon: DollarSign, adminStaffOnly: true },
]

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDialogOpen, setProfileDialogOpen] = useState(false)
  const location = useLocation()
  const { user, role, loading, signOut } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Redirect to auth page if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Only admin and staff can access dashboard
  // If user is logged in but doesn't have proper role, redirect to booking
  // if (role && role !== 'admin' && role !== 'staff') {
  //   return <Navigate to="/book" replace />;
  // }

  const filteredNavItems = navItems.filter((item) => {
    if (item.adminOnly && role !== "admin") return false
    if (item.adminStaffOnly && role === "client") return false
    return true
  })

  const handleSignOut = async () => {
    await signOut()
  }

  // Get user display name
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-muted/30 flex w-full">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="gwyn.png" alt="Gwyn Logo" className="h-14 w-22 object-cover rounded-full" />
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive =
              location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path))

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border">
          <button
            onClick={() => setProfileDialogOpen(true)}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-accent transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-accent-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{role || "User"}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="font-serif text-xl font-semibold text-foreground">
                {filteredNavItems.find(
                  (item) =>
                    location.pathname === item.path ||
                    (item.path !== "/dashboard" && location.pathname.startsWith(item.path)),
                )?.label || "Dashboard"}
              </h1>
            </div>
            <Button
              variant="outline"
              className="p-2 hover:bg-red-50 rounded-xl transition-colors text-red-500 bg-transparent"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* ProfileDialog */}
      <ProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </div>
  )
}

export default DashboardLayout
