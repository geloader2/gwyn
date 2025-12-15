import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AuthProvider } from "@/hooks/useAuth"
import Index from "./pages/Index"
import AuthPage from "./pages/AuthPage"
import BookingPage from "./pages/BookingPage"
import DashboardLayout from "./components/layouts/DashboardLayout"
import DashboardHome from "./pages/dashboard/DashboardHome"
import AppointmentsPage from "./pages/dashboard/AppointmentsPage"
import ClientsPage from "./pages/dashboard/ClientsPage"
import ServicesPage from "./pages/dashboard/ServicesPage"
import StaffPage from "./pages/dashboard/StaffPage"
import NotFound from "./pages/NotFound"
import ClientDashboard from "./pages/ClientDashboard"
import SalesPage from "./pages/dashboard/SalesPage"

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/book" element={<BookingPage />} />
            <Route path="/my-appointments" element={<ClientDashboard />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="staff" element={<StaffPage />} />
              <Route path="sales" element={<SalesPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
)

export default App
