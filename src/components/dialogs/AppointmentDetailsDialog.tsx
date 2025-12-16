"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { AppointmentWithDetails } from "@/hooks/useAppointments"
import { format, parseISO } from "date-fns"
import { X, Clock, Edit, Trash, MoreVertical, CalendarIcon, User } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useServices } from "@/hooks/useServices"
import { BookingDialog } from "./BookingDialog"
import { useIsMobile } from "@/hooks/use-mobile" // Add this import

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
  const isMobile = useIsMobile() // Add mobile detection

  useEffect(() => {
    if (appointment && appointment.service_ids) {
      setSelectedServices(appointment.service_ids)
      setHasUnsavedChanges(false)
    }
  }, [appointment])

  if (!appointment) {
    return null
  }

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
        <DialogContent className={isMobile ? "max-w-[95vw] p-0 h-[90vh] overflow-y-auto" : "max-w-2xl p-0"}>
          {/* Header Section - Responsive */}
          <div className="bg-blue-500 text-white p-4 md:p-6 rounded-t-lg relative">
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 left-3 md:top-4 md:left-4 text-white hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <div className={isMobile ? "pt-6" : "flex items-center justify-between"}>
              <div>
                <h2 className={isMobile ? "text-xl font-semibold mb-1" : "text-2xl font-semibold mb-2"}>
                  {format(parseISO(appointment.appointment_date), isMobile ? "d MMM" : "EEE d MMM")}
                </h2>
                <div className="flex items-center gap-1 md:gap-2 text-white/90 text-xs md:text-sm">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{appointment.start_time}</span>
                  {!isMobile && (
                    <>
                      <span>•</span>
                      <span>Doesn't repeat</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2 md:mt-0">
                <span className="px-3 py-1 md:px-4 md:py-1.5 bg-white/20 rounded-full text-xs md:text-sm font-medium border border-white/30">
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Main Content - Responsive Layout */}
          <div className={isMobile ? "flex flex-col" : "flex"}>
            {/* Client Info Sidebar - Stack on mobile */}
            <div className={`
              ${isMobile ? 'w-full p-4' : 'w-80 p-6'} 
              bg-slate-900 text-white 
              ${isMobile ? 'flex flex-row items-center gap-4' : 'flex flex-col items-center'}
            `}>
              <div className={`
                ${isMobile ? 'w-12 h-12' : 'w-24 h-24'} 
                bg-indigo-600 rounded-full flex items-center justify-center 
                ${isMobile ? 'text-lg' : 'text-3xl'} font-bold mb-4 md:mb-4
              `}>
                {getInitials(appointment.client_name || "Unknown")}
              </div>
              
              <div className={isMobile ? "flex-1" : ""}>
                <h3 className={`${isMobile ? "text-base" : "text-xl"} font-semibold mb-1`}>
                  {appointment.client_name}
                </h3>
                <p className="text-slate-400 text-xs md:text-sm mb-4 md:mb-8">Client</p>

                {!isMobile && (
                  <div className="w-full space-y-3">
                    <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/20">
                      Actions
                    </button>
                    <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors border border-white/20">
                      View profile
                    </button>
                  </div>
                )}

                <div className={isMobile ? "grid grid-cols-2 gap-2" : "mt-8 w-full space-y-4"}>
                  {!isMobile && (
                    <>
                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                        <span className="text-slate-400">Add pronouns</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-slate-400" />
                        <span className="text-slate-400">Add date of birth</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
                    <svg className="w-3 h-3 md:w-5 md:h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-white">Created {format(parseISO(appointment.created_at), isMobile ? "d MMM yy" : "d MMM yyyy")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services and Actions Section */}
            <div className={`flex-1 ${isMobile ? 'p-4' : 'p-6'}`}>
              {/* Services Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className={`${isMobile ? "text-base" : "text-lg"} font-semibold`}>Services</h3>
                {!editingServices && appointment.status !== "completed" && (
                  <Button 
                    variant="ghost" 
                    size={isMobile ? "sm" : "sm"}
                    onClick={() => setEditingServices(true)}
                    className={isMobile ? "h-8 px-2" : ""}
                  >
                    <Edit className={`${isMobile ? "h-3 w-3" : "h-4 w-4"} mr-1 md:mr-2`} />
                    {!isMobile && "Edit"}
                  </Button>
                )}
              </div>

              {/* Services List */}
              <div className="space-y-3 md:space-y-4">
                {currentServices.map((service) => (
                  <div key={service.id} className="flex items-start gap-2 md:gap-3 pb-3 md:pb-4 border-b border-slate-200">
                    <div className="w-1 h-12 md:h-16 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm md:text-base">{service.name}</h4>
                      <p className="text-xs md:text-sm text-slate-600 mt-0.5 md:mt-1">
                        {appointment.start_time} • {service.duration}min • {appointment.staff_name}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-slate-900 text-sm md:text-base">₱{service.price}</p>
                      {editingServices && (
                        <button
                          onClick={() => toggleService(service.id)}
                          className="mt-1 md:mt-2 text-red-500 hover:text-red-700"
                        >
                          <Trash className="h-3 w-3 md:h-4 md:w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Available Services for Editing */}
                {editingServices && (
                  <div className="border-t border-slate-200 pt-3 md:pt-4">
                    <p className="text-xs md:text-sm font-medium text-slate-700 mb-2">Available Services:</p>
                    <div className="space-y-1 md:space-y-2">
                      {services
                        .filter((s) => !selectedServices.includes(s.id) && s.is_active)
                        .map((service) => (
                          <button
                            key={service.id}
                            onClick={() => toggleService(service.id)}
                            className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 text-sm md:text-base truncate">{service.name}</p>
                              <p className="text-xs md:text-sm text-slate-600">{service.duration}min</p>
                            </div>
                            <p className="font-semibold text-slate-900 text-sm md:text-base flex-shrink-0 ml-2">
                              ₱{service.price}
                            </p>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Add Service Button */}
                {!editingServices && appointment.status !== "completed" && (
                  <button
                    onClick={() => setEditingServices(true)}
                    className="flex items-center gap-1 md:gap-2 text-blue-500 hover:text-blue-600 transition-colors text-sm md:text-base"
                  >
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">Add service</span>
                  </button>
                )}
              </div>

              {/* Total and Actions */}
              <div className={`${isMobile ? 'mt-6' : 'mt-8'} pt-4 md:pt-6 border-t border-slate-200`}>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <span className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>Total</span>
                  <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold`}>
                    ₱
                    {editingServices
                      ? currentServices.reduce((sum, s) => sum + Number(s.price), 0)
                      : appointment.total_price}
                  </span>
                </div>

                {editingServices ? (
                  <div className={`flex gap-2 md:gap-3 ${isMobile ? 'flex-col' : ''}`}>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingServices(false)
                        setSelectedServices(appointment.service_ids || [])
                        setHasUnsavedChanges(false)
                      }}
                      className={isMobile ? "w-full" : "flex-1"}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveServices}
                      disabled={!hasUnsavedChanges || selectedServices.length === 0}
                      className={`${isMobile ? 'w-full' : 'flex-1'} bg-blue-500 hover:bg-blue-600 text-white font-semibold`}
                    >
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 md:gap-3 ${isMobile ? 'flex-col' : ''}`}>
                    {appointment.status !== "completed" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className={`
                            ${isMobile ? 'w-full flex items-center justify-center gap-2 py-2.5' : 'p-3'}
                            border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors
                            ${isMobile ? 'text-sm' : ''}
                          `}>
                            <MoreVertical className="w-4 h-4 md:w-5 md:h-5" />
                            {isMobile && "More Options"}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isMobile ? "center" : "start"} className={isMobile ? "w-[90vw]" : ""}>
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
                      className={`
                        ${isMobile ? 'w-full py-3 text-base' : 'flex-1 py-6 text-lg'} 
                        ${appointment.status === "completed" || appointment.status === "cancelled"
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-300'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900'
                        } 
                        font-semibold rounded-full
                      `}
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

      {/* Reschedule Dialog */}
      {appointment && (
        <BookingDialog
          open={rescheduleDialogOpen}
          onOpenChange={setRescheduleDialogOpen}
          preselectedDate={parseISO(appointment.appointment_date)}
          editingAppointment={appointment}
        />
      )}
    </>
  )
}