"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AppointmentWithDetails } from "@/hooks/useAppointments"
import { format, parseISO } from "date-fns"
import { X, Clock, Edit, Trash, MoreVertical, CalendarIcon } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useServices } from "@/hooks/useServices"
import { BookingDialog } from "./BookingDialog"

interface AppointmentDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: AppointmentWithDetails | null
  onCheckout?: (appointment: AppointmentWithDetails) => void
}

export const AppointmentDetailsDialog = ({
  open,
  onOpenChange,
  appointment,
  onCheckout,
}: AppointmentDetailsDialogProps) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [editingServices, setEditingServices] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { services } = useServices()
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)

  useEffect(() => {
    if (appointment && appointment.service_ids) {
      setSelectedServices(appointment.service_ids)
      setHasUnsavedChanges(false)
    }
  }, [appointment])

  if (!appointment) {
    return null
  }
  // </CHANGE>

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    try {
      const { error: appointmentError } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("id", appointment.id)

      if (appointmentError) throw appointmentError

      const { error } = await supabase.from("sales").insert([
        {
          appointment_id: appointment.id,
          client_id: appointment.client_id,
          staff_id: appointment.staff_id,
          service_ids: appointment.service_ids,
          amount: appointment.total_price,
          payment_method: "cash",
          payment_status: "completed",
        },
      ])

      if (error) throw error

      toast.success("Checkout completed successfully!")
      onOpenChange(false)
      if (onCheckout) onCheckout(appointment)
    } catch (error: any) {
      toast.error(error.message || "Failed to checkout")
    } finally {
      setIsCheckingOut(false)
    }
  }

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const newServices = prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
      setHasUnsavedChanges(true)
      return newServices
    })
  }

  const handleSaveServices = async () => {
    try {
      const selectedServicesList = services.filter((s) => selectedServices.includes(s.id))
      const totalPrice = selectedServicesList.reduce((sum, s) => sum + Number(s.price), 0)
      const totalDuration = selectedServicesList.reduce((sum, s) => sum + s.duration, 0)

      const { error } = await supabase
        .from("appointments")
        .update({
          service_ids: selectedServices,
          total_price: totalPrice,
          total_duration: totalDuration,
        })
        .eq("id", appointment.id)

      if (error) throw error

      toast.success("Services updated successfully!")
      setEditingServices(false)
      setHasUnsavedChanges(false)
      onOpenChange(false)
      if (onCheckout) onCheckout(appointment)
    } catch (error: any) {
      toast.error(error.message || "Failed to update services")
    }
  }

  const handleCancelAppointment = async () => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", appointment.id)

      if (error) throw error

      toast.success("Appointment cancelled successfully!")
      onOpenChange(false)
      if (onCheckout) onCheckout(appointment)
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel appointment")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const currentServices = services.filter((s) =>
    editingServices ? selectedServices.includes(s.id) : appointment.service_ids?.includes(s.id),
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl p-0">
          <div className="bg-blue-500 text-white p-6 rounded-t-lg relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold mb-2">
                  {format(parseISO(appointment.appointment_date), "EEE d MMM")}
                </h2>
                <div className="flex items-center gap-2 text-white/90">
                  <Clock className="h-4 w-4" />
                  <span>{appointment.start_time}</span>
                  <span>•</span>
                  <span>Doesn't repeat</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium border border-white/30">
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex">
            <div className="w-80 bg-slate-900 text-white p-6 flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                {getInitials(appointment.client_name || "Unknown")}
              </div>
              <h3 className="text-xl font-semibold mb-1">{appointment.client_name}</h3>
              <p className="text-slate-400 text-sm mb-8">Client</p>

              <div className="w-full space-y-3">
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/20">
                  Actions
                </button>
                <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/20">
                  View profile
                </button>
              </div>

              <div className="mt-8 w-full space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-slate-400">Add pronouns</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-slate-400">Add date of birth</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-white">Created {format(parseISO(appointment.created_at), "d MMM yyyy")}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Services</h3>
                {!editingServices && appointment.status !== "completed" && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingServices(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {currentServices.map((service, index) => (
                  <div key={service.id} className="flex items-start gap-3 pb-4 border-b border-slate-200">
                    <div className="w-1 h-16 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{service.name}</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        {appointment.start_time} • in {service.duration}min • {appointment.staff_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">₱{service.price}</p>
                      {editingServices && (
                        <button
                          onClick={() => toggleService(service.id)}
                          className="mt-2 text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {editingServices && (
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Available Services:</p>
                    <div className="space-y-2">
                      {services
                        .filter((s) => !selectedServices.includes(s.id) && s.is_active)
                        .map((service) => (
                          <button
                            key={service.id}
                            onClick={() => toggleService(service.id)}
                            className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div>
                              <p className="font-medium text-slate-900">{service.name}</p>
                              <p className="text-sm text-slate-600">{service.duration}min</p>
                            </div>
                            <p className="font-semibold text-slate-900">₱{service.price}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {!editingServices && appointment.status !== "completed" && (
                  <button
                    onClick={() => setEditingServices(true)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Add service</span>
                  </button>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">
                    ₱
                    {editingServices
                      ? currentServices.reduce((sum, s) => sum + Number(s.price), 0)
                      : appointment.total_price}
                  </span>
                </div>

                {editingServices ? (
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingServices(false)
                        setSelectedServices(appointment.service_ids || [])
                        setHasUnsavedChanges(false)
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveServices}
                      disabled={!hasUnsavedChanges || selectedServices.length === 0}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    {appointment.status !== "completed" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">
                            <MoreVertical className="w-5 h-5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setRescheduleDialogOpen(true)}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Reschedule
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCancelAppointment} className="text-red-600">
                            <Trash className="h-4 w-4 mr-2" />
                            Cancel Booking
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || appointment.status === "completed" || appointment.status === "cancelled"}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-semibold py-6 text-lg rounded-full"
                    >
                    {isCheckingOut
                        ? "Processing..."
                        : appointment.status === "completed"
                        ? "Already Checked Out"
                        : appointment.status === "cancelled"
                            ? "Cancelled Appointment"
                            : "Checkout"}
                    </Button>
                                        
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {appointment && (
        <BookingDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          preselectedDate={parseISO(appointment.appointment_date)}
          editingAppointment={appointment}
        />
      )}
      {/* </CHANGE> */}
    </>
  )
}
