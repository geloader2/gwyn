"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { X, User, Clock, Calendar, Check, ChevronRight, ChevronLeft, Plus, Minus, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useServices, type Service } from "@/hooks/useServices"
import { useStaff } from "@/hooks/useStaff"
import { useAuth } from "@/hooks/useAuth"
import { useAppointments } from "@/hooks/useAppointments"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useIsMobile } from "@/hooks/use-mobile"
// Import the useClients hook
import { useClients } from "@/hooks/useClients"

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedDate?: Date | null
  editingAppointment?: any // For rescheduling/editing
  onBookingComplete?: () => void
}

type BookingStep = "service" | "client" | "staff" | "time" | "confirm"

export const BookingDialog = ({
  open,
  onOpenChange,
  preselectedDate,
  editingAppointment,
  onBookingComplete,
}: BookingDialogProps) => {
  const [step, setStep] = useState<BookingStep>("service")
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all")

  const { services, categories, loading: servicesLoading } = useServices()
  const { staff, loading: staffLoading } = useStaff()
  const { user, role } = useAuth()
  const { createAppointment } = useAppointments()
  const isMobile = useIsMobile()

  // Use the useClients hook instead of local state and direct Supabase calls
  const { clients, loading: clientsLoading, createClient: createClientHook } = useClients()

  const [clientFormData, setClientFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })

  const appointmentDate = preselectedDate || new Date()

  useEffect(() => {
    const autoFillClientData = async () => {
      if (user && role === "client") {
        // Find the client record for the logged-in user
        const clientRecord = clients.find((c) => c.user_id === user.id)
        if (clientRecord) {
          setSelectedClient(clientRecord.id)
          setClientFormData({
            name: clientRecord.name || "",
            email: clientRecord.email || "",
            phone: clientRecord.phone || "",
            notes: clientRecord.notes || "",
          })
        }
      }
    }

    if (!clientsLoading) {
      autoFillClientData()
    }
  }, [user, role, clients, clientsLoading])

  // If editing appointment, pre-fill data
  useEffect(() => {
    if (editingAppointment) {
      setSelectedServices(services.filter((s) => editingAppointment.service_ids?.includes(s.id)))
      setSelectedClient(editingAppointment.client_id)
      setSelectedStaff(editingAppointment.staff_id)
      setSelectedTime(editingAppointment.start_time)

      // Load client details if available
      if (editingAppointment.client_id) {
        const client = clients.find((c) => c.id === editingAppointment.client_id)
        if (client) {
          setClientFormData({
            name: client.name || "",
            email: client.email || "",
            phone: client.phone || "",
            notes: client.notes || "",
          })
        }
      }
    }
  }, [editingAppointment, services, clients])

  const steps: { key: BookingStep; label: string }[] =
    role === "client"
      ? [
          { key: "service", label: "Services" },
          { key: "staff", label: "Staff" },
          { key: "time", label: "Time" },
          { key: "confirm", label: "Confirm" },
        ]
      : [
          { key: "service", label: "Services" },
          { key: "client", label: "Client" },
          { key: "staff", label: "Staff" },
          { key: "time", label: "Time" },
          { key: "confirm", label: "Confirm" },
        ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex].key)
    }
  }

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key)
    }
  }

  const toggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === service.id)
      if (exists) {
        return prev.filter((s) => s.id !== service.id)
      }
      return [...prev, service]
    })
  }

  const removeService = (serviceId: string) => {
    setSelectedServices((prev) => prev.filter((s) => s.id !== serviceId))
  }

  const totalPrice = selectedServices.reduce((sum, s) => sum + Number(s.price), 0)
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)

  const activeServices = services.filter((s) => s.is_active)
  const activeStaff = staff.filter((s) => s.is_active)

  // Filter services by selected category
  const filteredServices = selectedCategory === "all" 
    ? activeServices 
    : activeServices.filter((s) => s.category === selectedCategory)

  // Generate time slots (10 AM to 5 PM, 15-minute intervals)
  const generateTimeSlots = () => {
    const slots = []
    const startHour = 10 // 10 AM
    const endHour = 17 // 5 PM

    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === endHour && minute > 0) break // Stop at 5:00 PM

        const period = hour >= 12 ? "PM" : "AM"
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const timeString = `${displayHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`
        const valueString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

        slots.push({ display: timeString, value: valueString })
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  const handleCreateOrUpdateAppointment = async () => {
    if (!selectedClient || !selectedStaff || !selectedTime || selectedServices.length === 0) {
      toast.error("Please fill all required fields")
      return
    }

    setSubmitting(true)

    try {
      // Calculate end time based on total duration
      const [hours, minutes] = selectedTime.split(":").map(Number)
      const endMinutes = hours * 60 + minutes + totalDuration
      const endHours = Math.floor(endMinutes / 60)
      const endMins = endMinutes % 60
      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

      if (editingAppointment) {
        // Update existing appointment
        const { error } = await supabase
          .from("appointments")
          .update({
            client_id: selectedClient,
            staff_id: selectedStaff,
            service_ids: selectedServices.map((s) => s.id),
            appointment_date: format(appointmentDate, "yyyy-MM-dd"),
            start_time: selectedTime,
            end_time: endTime,
            total_duration: totalDuration,
            total_price: totalPrice,
            notes: clientFormData.notes || undefined,
          })
          .eq("id", editingAppointment.id)

        if (error) throw error
        toast.success("Appointment updated successfully!")
      } else {
        // Create new appointment
        await createAppointment({
          client_id: selectedClient,
          staff_id: selectedStaff,
          service_ids: selectedServices.map((s) => s.id),
          appointment_date: format(appointmentDate, "yyyy-MM-dd"),
          start_time: selectedTime,
          end_time: endTime,
          total_duration: totalDuration,
          total_price: totalPrice,
          notes: clientFormData.notes || undefined,
          status: "confirmed",
        })
      }

      // Refresh appointments
      //await refetch()
      if (onBookingComplete) {
        onBookingComplete()
      }
      onOpenChange(false)

      // Reset form
      setSelectedServices([])
      setSelectedClient(null)
      setSelectedStaff(null)
      setSelectedTime(null)
      setClientFormData({ name: "", email: "", phone: "", notes: "" })
      setStep("service")
      setSelectedCategory("all")
    } catch (error: any) {
      toast.error(error.message || "Failed to save appointment")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateNewClient = async () => {
    if (!clientFormData.name || !clientFormData.email) {
      toast.error("Name and email are required")
      return
    }

    try {
      // Use the createClient function from useClients hook
      const result = await createClientHook({
        name: clientFormData.name,
        email: clientFormData.email,
        phone: clientFormData.phone,
        date_of_birth: null,
        notes: clientFormData.notes,
        // Note: We're not setting a password here, so it will create a client without user account
      })

      if (result.success) {
        // Find the newly created client
        const newClient = clients.find((c) => c.email === clientFormData.email && c.name === clientFormData.name)

        if (newClient) {
          setSelectedClient(newClient.id)
          toast.success("Client created successfully!")
          handleNext()
        }
      } else {
        throw new Error("Failed to create client")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create client")
    }
  }

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("service")
      setSelectedServices([])
      if (role !== "client") {
        setSelectedClient(null)
        setClientFormData({ name: "", email: "", phone: "", notes: "" })
      }
      setSelectedStaff(null)
      setSelectedTime(null)
      setSelectedCategory("all")
    }
  }, [open, role])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 gap-0 flex flex-col",
          isMobile ? "w-screen h-screen max-w-none rounded-none m-0" : "max-w-4xl max-h-[90vh] rounded-lg",
        )}
      >
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4 border-b shrink-0">
          <DialogTitle className="text-lg md:text-2xl font-semibold">
            {editingAppointment ? "Edit Appointment" : "New Booking"}
          </DialogTitle>
          <p className="text-xs md:text-sm text-muted-foreground">{format(appointmentDate, "EEEE, MMMM d, yyyy")}</p>
        </DialogHeader>

        <div className="px-4 md:px-6 py-3 md:py-4 border-b shrink-0">
          <ScrollArea className="w-full">
            <div className="flex items-center justify-start md:justify-center gap-1 md:gap-3 min-w-max pb-2">
              {steps.map((s, index) => (
                <div key={s.key} className="flex items-center flex-shrink-0">
                  <div
                    className={cn(
                      "flex items-center gap-1.5 md:gap-2",
                      index <= currentStepIndex ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all flex-shrink-0",
                        index < currentStepIndex
                          ? "bg-primary text-primary-foreground"
                          : index === currentStepIndex
                            ? "bg-primary text-primary-foreground ring-2 md:ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {index < currentStepIndex ? <Check className="h-3.5 w-3.5 md:h-4 md:w-4" /> : index + 1}
                    </div>
                    <span className={cn("text-xs md:text-sm font-medium whitespace-nowrap")}>{s.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 mx-1 md:mx-2 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 md:px-6 py-4 md:py-6">
            {/* Service Selection */}
            {step === "service" && (
              <div className="animate-fade-in space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Select Services</h3>
                
                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={cn(
                      "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors",
                      selectedCategory === "all"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    All Services
                  </button>
                  {categories.map((category) => {
                    const categoryServices = activeServices.filter((s) => s.category === category)
                    if (categoryServices.length === 0) return null
                    
                    return (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium transition-colors",
                          selectedCategory === category
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {category}
                      </button>
                    )
                  })}
                </div>
                
                {servicesLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className={cn("gap-4 md:gap-6", isMobile ? "space-y-4" : "grid lg:grid-cols-3")}>
                    <div className={isMobile ? "" : "lg:col-span-2"}>
                      <div className="space-y-6">
                        {selectedCategory === "all" ? (
                          // Show all services grouped by category
                          categories.map((category) => {
                            const categoryServices = activeServices.filter((s) => s.category === category)
                            if (categoryServices.length === 0) return null

                            return (
                              <div key={category}>
                                {/* <h4 className="font-semibold text-foreground mb-3 text-sm md:text-base">{category}</h4> */}
                                <div className="space-y-2">
                                  {categoryServices.map((service) => {
                                    const isSelected = selectedServices.some((s) => s.id === service.id)
                                    return (
                                      <div
                                        key={service.id}
                                        className={cn(
                                          "flex items-center justify-between p-2.5 md:p-3 rounded-lg border transition-colors cursor-pointer",
                                          isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/50",
                                        )}
                                        onClick={() => toggleService(service)}
                                      >
                                        <div className="flex-1 min-w-0 mr-2 md:mr-4">
                                          <h5 className="font-medium text-foreground text-sm md:text-base">
                                            {service.name}
                                          </h5>
                                          {/* <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                                            {service.description || "No description"}
                                          </p> */}
                                          <div className="flex items-center gap-2 md:gap-4 mt-1">
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {service.duration} min
                                            </span>
                                            <span className="text-xs md:text-sm font-semibold text-primary">
                                              ₱{service.price}
                                            </span>
                                          </div>
                                        </div>
                                        <Button
                                          variant={isSelected ? "default" : "outline"}
                                          size="icon"
                                          className="shrink-0 h-7 w-7 md:h-8 md:w-8 rounded-full"
                                        >
                                          {isSelected ? (
                                            <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                          ) : (
                                            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                          )}
                                        </Button>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })
                        ) : (
                          // Show filtered services for selected category
                          <div>
                            <div className="space-y-2">
                              {filteredServices.map((service) => {
                                const isSelected = selectedServices.some((s) => s.id === service.id)
                                return (
                                  <div
                                    key={service.id}
                                    className={cn(
                                      "flex items-center justify-between p-2.5 md:p-3 rounded-lg border transition-colors cursor-pointer",
                                      isSelected
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50",
                                    )}
                                    onClick={() => toggleService(service)}
                                  >
                                    <div className="flex-1 min-w-0 mr-2 md:mr-4">
                                      <h5 className="font-medium text-foreground text-sm md:text-base">
                                        {service.name}
                                      </h5>
                                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                                        {service.description || "No description"}
                                      </p>
                                      <div className="flex items-center gap-2 md:gap-4 mt-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {service.duration} min
                                        </span>
                                        <span className="text-xs md:text-sm font-semibold text-primary">
                                          ₱{service.price}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant={isSelected ? "default" : "outline"}
                                      size="icon"
                                      className="shrink-0 h-7 w-7 md:h-8 md:w-8 rounded-full"
                                    >
                                      {isSelected ? (
                                        <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                      ) : (
                                        <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                      )}
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                            {filteredServices.length === 0 && (
                              <p className="text-muted-foreground text-center py-8 text-sm">
                                No services found in this category
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Services Panel */}
                    <div className="border rounded-lg p-3 md:p-4 h-fit sticky top-0">
                      <div className="flex items-center gap-2 mb-3 md:mb-4">
                        <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        <h4 className="font-semibold text-foreground text-sm md:text-base">Selected Services</h4>
                      </div>

                      {selectedServices.length === 0 ? (
                        <p className="text-muted-foreground text-xs md:text-sm py-3 md:py-4 text-center">
                          No services selected
                        </p>
                      ) : (
                        <>
                          <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
                            {selectedServices.map((service) => (
                              <div
                                key={service.id}
                                className="flex items-start justify-between gap-2 p-2 rounded bg-muted/50"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-xs md:text-sm">{service.name}</p>
                                  <div className="flex items-center gap-1 md:gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">{service.duration} min</span>
                                    <span className="text-xs font-semibold text-primary">₱{service.price}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => removeService(service.id)}
                                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                >
                                  <X className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="border-t pt-3 md:pt-4 space-y-1 md:space-y-2">
                            <div className="flex justify-between text-xs md:text-sm">
                              <span className="text-muted-foreground">Total Duration</span>
                              <span className="font-medium text-foreground">{totalDuration} min</span>
                            </div>
                            <div className="flex justify-between text-sm md:text-base">
                              <span className="text-muted-foreground">Total Price</span>
                              <span className="font-semibold text-primary">₱{totalPrice}</span>
                            </div>
                          </div>
                        </>
                      )}

                      <Button
                        className="w-full mt-3 md:mt-4"
                        onClick={handleNext}
                        disabled={selectedServices.length === 0}
                        size={isMobile ? "sm" : "default"}
                      >
                        Continue
                        <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 ml-1 md:ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === "client" && role !== "client" && (
              <div className="animate-fade-in space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Select Client</h3>
                <div className={cn("gap-4 md:gap-6", isMobile ? "space-y-4" : "grid md:grid-cols-2")}>
                  {/* Existing Clients */}
                  <div>
                    {/* <h4 className="font-medium mb-3 text-sm md:text-base">Existing Clients</h4> */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {clientsLoading ? (
                        <div className="flex items-center justify-center h-32">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <>
                          {clients.map((client) => (
                            <div
                              key={client.id}
                              className={cn(
                                "p-2.5 md:p-3 rounded-lg border cursor-pointer transition-colors",
                                selectedClient === client.id
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50",
                              )}
                              onClick={() => setSelectedClient(client.id)}
                            >
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <User className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate text-sm md:text-base">{client.name}</p>
                                  <p className="text-xs md:text-sm text-muted-foreground truncate">{client.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                          {clients.length === 0 && (
                            <p className="text-muted-foreground text-center py-8 text-sm">No clients found</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* New Client Form */}
                  {/* <div>
                    <h4 className="font-medium mb-3 text-sm md:text-base">Add New Client</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-1 block">Name *</label>
                        <input
                          type="text"
                          value={clientFormData.name}
                          onChange={(e) => setClientFormData((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2.5 md:px-3 py-1.5 md:py-2 rounded border border-border text-sm"
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-1 block">Email *</label>
                        <input
                          type="email"
                          value={clientFormData.email}
                          onChange={(e) => setClientFormData((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full px-2.5 md:px-3 py-1.5 md:py-2 rounded border border-border text-sm"
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-1 block">Phone</label>
                        <input
                          type="tel"
                          value={clientFormData.phone}
                          onChange={(e) => setClientFormData((prev) => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-2.5 md:px-3 py-1.5 md:py-2 rounded border border-border text-sm"
                          placeholder="+63 XXX XXX XXXX"
                        />
                      </div>
                      <div>
                        <label className="text-xs md:text-sm font-medium mb-1 block">Notes (Optional)</label>
                        <textarea
                          value={clientFormData.notes}
                          onChange={(e) => setClientFormData((prev) => ({ ...prev, notes: e.target.value }))}
                          className="w-full px-2.5 md:px-3 py-1.5 md:py-2 rounded border border-border text-sm min-h-[70px]"
                          placeholder="Any additional notes..."
                        />
                      </div>
                      <Button
                        onClick={handleCreateNewClient}
                        disabled={!clientFormData.name || !clientFormData.email}
                        className="w-full"
                        size="sm"
                      >
                        Add Client
                      </Button>
                    </div>
                  </div> */}
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleBack} size={isMobile ? "sm" : "default"}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!selectedClient} size={isMobile ? "sm" : "default"}>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Staff Selection */}
            {step === "staff" &&  (
              <div className="animate-fade-in space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Select Staff</h3>
                {staffLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <>
                    <div
                      className={cn("gap-3 md:gap-4", isMobile ? "space-y-3" : "grid md:grid-cols-2 lg:grid-cols-3")}
                    >
                      {activeStaff.map((s) => (
                        <div
                          key={s.id}
                          className={cn(
                            "p-3 md:p-4 rounded-lg border cursor-pointer transition-all",
                            selectedStaff === s.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50",
                          )}
                          onClick={() => setSelectedStaff(s.id)}
                        >
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden flex-shrink-0">
                              {s.avatar_url ? (
                                <img
                                  src={s.avatar_url || "/placeholder.svg"}
                                  alt={s.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-semibold text-accent-foreground text-xs md:text-sm">
                                  {s.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold truncate text-sm md:text-base">{s.name}</h4>
                              <p className="text-xs md:text-sm text-muted-foreground truncate">{s.title}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {activeStaff.length === 0 && (
                      <p className="text-muted-foreground text-center py-8 text-sm">No staff members available</p>
                    )}

                    <div className="flex justify-between pt-4 border-t">
                      <Button variant="outline" onClick={handleBack} size={isMobile ? "sm" : "default"}>
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                      </Button>
                      <Button onClick={handleNext} disabled={!selectedStaff} size={isMobile ? "sm" : "default"}>
                        Continue
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Time Selection */}
            {step === "time" && (
              <div className="animate-fade-in space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Select Time</h3>
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 md:h-5 w-5 text-primary" />
                    <span className="font-medium text-sm md:text-base">
                      {format(appointmentDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "gap-2",
                      isMobile ? "grid grid-cols-3" : "grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
                    )}
                  >
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setSelectedTime(slot.value)}
                        className={cn(
                          "py-2 px-2 md:px-3 rounded border text-xs md:text-sm transition-all",
                          selectedTime === slot.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleBack} size={isMobile ? "sm" : "default"}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!selectedTime} size={isMobile ? "sm" : "default"}>
                    Continue
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Confirmation */}
            {step === "confirm" && (
              <div className="animate-fade-in space-y-4">
                <h3 className="text-base md:text-lg font-semibold">Confirm Booking</h3>
                <div className="border rounded-lg p-3 md:p-4">
                  <h4 className="font-semibold mb-3 text-sm md:text-base">Booking Summary</h4>
                  <div className="space-y-2.5 md:space-y-3">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span className="font-medium">{format(appointmentDate, "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span className="font-medium">
                        {timeSlots.find((slot) => slot.value === selectedTime)?.display}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Staff</span>
                      <span className="font-medium truncate max-w-[60%]">
                        {staff.find((s) => s.id === selectedStaff)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium truncate max-w-[60%]">
                        {clients.find((c) => c.id === selectedClient)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="text-muted-foreground">Services</span>
                      <div className="text-right max-w-[60%] space-y-0.5">
                        {selectedServices.map((service) => (
                          <div key={service.id} className="text-xs truncate">
                            {service.name} - ₱{service.price}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border-t pt-2.5 md:pt-3">
                      <div className="flex justify-between font-semibold text-sm md:text-base">
                        <span>Total</span>
                        <span>₱{totalPrice}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={handleBack} size={isMobile ? "sm" : "default"}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <Button
                    onClick={handleCreateOrUpdateAppointment}
                    disabled={submitting}
                    size={isMobile ? "sm" : "default"}
                  >
                    {submitting ? "Saving..." : editingAppointment ? "Update" : "Confirm"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}