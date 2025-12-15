"use client"

import { useState } from "react"
import { Link, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Edit, X, ArrowLeft, User, CheckCircle2, TrendingUp } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useClientAppointments } from "@/hooks/useClientAppointments"
import { format, parseISO, isFuture, isPast, startOfMonth, endOfMonth } from "date-fns"
import { AppointmentEditDialog } from "@/components/dialogs/AppointmentEditDialog"
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog"

const ClientDashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const { appointments, loading, updateAppointment, cancelAppointment } = useClientAppointments()
  const [editingAppointment, setEditingAppointment] = useState<any | null>(null)
  const [cancellingAppointment, setCancellingAppointment] = useState<any | null>(null)
  const [cancelling, setCancelling] = useState(false)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const upcomingAppointments = appointments.filter((apt) =>
    isFuture(parseISO(`${apt.appointment_date}T${apt.start_time}`)),
  )

  const pastAppointments = appointments.filter((apt) => isPast(parseISO(`${apt.appointment_date}T${apt.start_time}`)))

  const currentMonth = new Date()
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)

  const monthlyAppointments = appointments.filter((apt) => {
    const aptDate = parseISO(apt.appointment_date)
    return aptDate >= monthStart && aptDate <= monthEnd
  })

  const totalSpent = pastAppointments.reduce((sum, apt) => sum + Number(apt.total_price || 0), 0)

  const handleCancelConfirm = async () => {
    if (!cancellingAppointment) return
    setCancelling(true)
    await cancelAppointment(cancellingAppointment.id)
    setCancelling(false)
    setCancellingAppointment(null)
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Client"

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/gwyn.png" alt="Gwyn Logo" className="h-14 w-22 object-cover rounded-full" />
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/book">
                <Button variant="default">
                  <Calendar className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-semibold text-foreground mb-2">Welcome back, {displayName}!</h1>
          <p className="text-muted-foreground">Manage your appointments and view your booking history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-foreground">{upcomingAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-foreground">{pastAppointments.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-foreground">{monthlyAppointments.length}</p>
                <p className="text-sm text-muted-foreground">This Month</p>
              </div>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold text-foreground">₱{totalSpent}</p>
                <p className="text-sm text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif font-semibold text-foreground">Upcoming Appointments</h2>
            <Link to="/book">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Book New
              </Button>
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No upcoming appointments</p>
              <Link to="/book">
                <Button variant="default">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Your First Appointment
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm text-muted-foreground">{format(parseISO(apt.appointment_date), "EEE")}</p>
                      <p className="text-2xl font-semibold text-foreground">
                        {format(parseISO(apt.appointment_date), "d")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(apt.appointment_date), "MMM yyyy")}
                      </p>
                    </div>
                    <div className="h-12 w-1 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{apt.service_names?.join(", ")}</p>
                      <p className="text-sm text-muted-foreground">With {apt.staff_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {apt.start_time} - {apt.end_time} ({apt.total_duration} mins)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingAppointment(apt)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCancellingAppointment(apt)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Appointment History */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-xl font-serif font-semibold text-foreground mb-6">Appointment History</h2>

          {pastAppointments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No past appointments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-semibold text-foreground">
                      {format(parseISO(apt.appointment_date), "MMM d")}
                    </p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(apt.appointment_date), "yyyy")}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{apt.service_names?.join(", ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.staff_name} • {apt.start_time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">₱{apt.total_price}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AppointmentEditDialog
        open={!!editingAppointment}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
        appointment={editingAppointment}
        onSubmit={updateAppointment}
      />

      <DeleteConfirmDialog
        open={!!cancellingAppointment}
        onOpenChange={(open) => !open && setCancellingAppointment(null)}
        title="Cancel Appointment"
        description={`Are you sure you want to cancel this appointment? This action cannot be undone.`}
        onConfirm={handleCancelConfirm}
        loading={cancelling}
      />
    </div>
  )
}

export default ClientDashboard
