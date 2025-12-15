"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, Navigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  ArrowLeft,
  Clock,
  Calendar,
  Check,
  ChevronRight,
  User,
  Mail,
  Phone,
  Plus,
  Minus,
  X,
  ShoppingCart,
  ChevronLeft,
  CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addDays, startOfWeek, addWeeks, subWeeks } from "date-fns"
import { useServices, type Service } from "@/hooks/useServices"
import { useStaff, type Staff } from "@/hooks/useStaff"
import { useAuth } from "@/hooks/useAuth"
import { useAppointments } from "@/hooks/useAppointments"
import { supabase } from "@/integrations/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarPicker } from "@/components/ui/calendar"

type BookingStep = "service" | "staff" | "datetime" | "details" | "confirm"

const BookingPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<BookingStep>("service")
  const [selectedServices, setSelectedServices] = useState<Service[]>([])
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })

  const { services, categories, loading: servicesLoading } = useServices()
  const { staff, loading: staffLoading } = useStaff()
  const { user, loading: authLoading } = useAuth()
  const { createAppointment } = useAppointments()

  const [weekStartState, setWeekStartState] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [formDataState, setFormDataState] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  })

  useEffect(() => {
    if (!user) {
      navigate("/auth", { replace: true })
    }
  }, [user, navigate])

  useEffect(() => {
    if (user) {
      setFormDataState((prev) => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.user_metadata?.phone || prev.phone,
      }))
    }
  }, [user])

  const [servicesState, setServicesState] = useState<Service[]>([])
  const [staffState, setStaffState] = useState<Staff[]>([])
  const [authLoadingState, setAuthLoadingState] = useState(true)

  useEffect(() => {
    setServicesState(services)
    setStaffState(staff)
    setAuthLoadingState(authLoading)
  }, [services, staff, authLoading])

  if (authLoadingState) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  const activeServices = servicesState.filter((s) => s.is_active)
  const activeStaff = staffState.filter((s) => s.is_active)

  const dates = Array.from({ length: 7 }, (_, i) => addDays(weekStartState, i))

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

  const convertTo24Hour = (time12h: string): string => {
    const [time, period] = time12h.split(" ")
    let [hours, minutes] = time.split(":").map(Number)

    if (period === "PM" && hours !== 12) {
      hours += 12
    } else if (period === "AM" && hours === 12) {
      hours = 0
    }

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`
  }

  const steps: { key: BookingStep; label: string }[] = [
    { key: "service", label: "Services" },
    { key: "staff", label: "Specialist" },
    { key: "datetime", label: "Date & Time" },
    { key: "details", label: "Your Details" },
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

  const selectedStaffMember = activeStaff.find((s) => s.id === selectedStaff)

  const handlePreviousWeek = () => {
    setWeekStartState((prev) => subWeeks(prev, 1))
  }

  const handleNextWeek = () => {
    setWeekStartState((prev) => addWeeks(prev, 1))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/public/gwyn.png" alt="Gwyn Logo" className="h-14 w-22 object-cover rounded-full" />
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {steps.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    index <= currentStepIndex ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      index < currentStepIndex
                        ? "bg-primary text-primary-foreground"
                        : index === currentStepIndex
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index < currentStepIndex ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{s.label}</span>
                </div>
                {index < steps.length - 1 && <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {/* Service Selection - New Layout */}
          {step === "service" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif font-semibold text-foreground mb-2 text-center">
                Choose Your Treatments
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Select one or more services from our premium offerings
              </p>

              {servicesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Services List */}
                  <div className="lg:col-span-2 glass-card rounded-2xl overflow-hidden">
                    <ScrollArea className="h-[500px]">
                      {categories.map((category) => {
                        const categoryServices = activeServices.filter((s) => s.category === category)
                        if (categoryServices.length === 0) return null

                        return (
                          <div key={category} className="border-b border-border last:border-b-0">
                            {/* Category Header */}
                            <div className="bg-muted/50 px-6 py-3 sticky top-0 z-10">
                              <h3 className="font-semibold text-foreground">{category}</h3>
                            </div>

                            {/* Services in Category */}
                            <div className="divide-y divide-border">
                              {categoryServices.map((service) => {
                                const isSelected = selectedServices.some((s) => s.id === service.id)
                                return (
                                  <div
                                    key={service.id}
                                    className={cn(
                                      "flex items-center justify-between px-6 py-4 transition-colors",
                                      isSelected && "bg-primary/5",
                                    )}
                                  >
                                    <div className="flex-1 min-w-0 mr-4">
                                      <h4 className="font-medium text-foreground">{service.name}</h4>
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {service.description || "No description"}
                                      </p>
                                      <div className="flex items-center gap-4 mt-1">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {service.duration} min
                                        </span>
                                        <span className="text-sm font-semibold text-primary">
                                          {Number(service.price) === 0 ? "Free" : `₱${service.price}`}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant={isSelected ? "default" : "outline"}
                                      size="icon"
                                      className="shrink-0 h-10 w-10 rounded-full"
                                      onClick={() => toggleService(service)}
                                    >
                                      {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}

                      {activeServices.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No services available at the moment.</p>
                        </div>
                      )}
                    </ScrollArea>
                  </div>

                  {/* Selected Services Panel */}
                  <div className="glass-card rounded-2xl p-6 h-fit lg:sticky lg:top-24">
                    <div className="flex items-center gap-2 mb-4">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Selected Services</h3>
                    </div>

                    {selectedServices.length === 0 ? (
                      <p className="text-muted-foreground text-sm py-8 text-center">
                        No services selected yet. Click the + button to add services.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-3 mb-6">
                          {selectedServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground text-sm">{service.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted-foreground">{service.duration} min</span>
                                  <span className="text-xs font-semibold text-primary">₱{service.price}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeService(service.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-border pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Duration</span>
                            <span className="font-medium text-foreground">{totalDuration} min</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Price</span>
                            <span className="font-semibold text-primary text-lg">₱{totalPrice}</span>
                          </div>
                        </div>
                      </>
                    )}
                    <center>
                      {" "}
                      <Button variant="hero" size="lg" disabled={selectedServices.length === 0} onClick={handleNext}>
                        Continue
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </center>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Staff Selection */}
          {step === "staff" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif font-semibold text-foreground mb-2 text-center">
                Choose Your Specialist
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Select a specialist or let us assign the best available
              </p>

              {staffLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {activeStaff.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStaff(s.id)}
                      className={cn(
                        "glass-card rounded-xl p-6 text-left transition-all duration-300 hover:shadow-lg",
                        selectedStaff === s.id && "ring-2 ring-primary bg-primary/5",
                      )}
                    >
                      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4 overflow-hidden">
                        {s.avatar_url ? (
                          <img
                            src={s.avatar_url || "/placeholder.svg"}
                            alt={s.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl font-semibold text-accent-foreground">
                            {s.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-foreground text-lg mb-1">{s.name}</h4>
                      <p className="text-primary text-sm font-medium mb-2">{s.title}</p>
                      <p className="text-muted-foreground text-sm line-clamp-2">{s.bio || "No bio available"}</p>
                    </button>
                  ))}

                  {activeStaff.length === 0 && (
                    <div className="col-span-full glass-card rounded-xl p-12 text-center">
                      <p className="text-muted-foreground">No specialists available at the moment.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="hero" size="lg" disabled={!selectedStaff} onClick={handleNext}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Date & Time Selection */}
          {step === "datetime" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif font-semibold text-foreground mb-2 text-center">Select Date & Time</h2>
              <p className="text-muted-foreground text-center mb-8">Choose your preferred appointment slot</p>

              {/* Date Selection */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Select Date
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous Week
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          Pick Date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="center">
                        <CalendarPicker
                          mode="single"
                          selected={selectedDate || undefined}
                          onSelect={(date) => {
                            if (date) {
                              setSelectedDate(date)
                              setWeekStartState(startOfWeek(date, { weekStartsOn: 1 }))
                            }
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" onClick={handleNextWeek}>
                      Next Week
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
                  {dates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        "flex-shrink-0 w-20 rounded-xl p-4 text-center transition-all duration-200",
                        selectedDate?.toDateString() === date.toDateString()
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-card border border-border hover:border-primary/50",
                      )}
                    >
                      <p className="text-xs font-medium opacity-80">{format(date, "EEE")}</p>
                      <p className="text-2xl font-semibold">{format(date, "d")}</p>
                      <p className="text-xs opacity-80">{format(date, "MMM")}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              {selectedDate && (
                <div className="mb-8">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Select Time
                  </h3>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.value}
                        onClick={() => setSelectedTime(slot.value)}
                        className={cn(
                          "rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200",
                          selectedTime === slot.value
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-card border border-border hover:border-primary/50",
                        )}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" size="lg" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button variant="hero" size="lg" disabled={!selectedDate || !selectedTime} onClick={handleNext}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Details Step */}
          {step === "details" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif font-semibold text-foreground mb-2 text-center">Your Details</h2>
              <p className="text-muted-foreground text-center mb-8">Please provide your contact information</p>

              <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <User className="h-4 w-4 text-primary" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formDataState.name}
                      onChange={(e) => setFormDataState((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Mail className="h-4 w-4 text-primary" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formDataState.email}
                      onChange={(e) => setFormDataState((prev) => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formDataState.phone}
                      onChange={(e) => setFormDataState((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="+63 XXX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Notes (Optional)</label>
                    <textarea
                      value={formDataState.notes}
                      onChange={(e) => setFormDataState((prev) => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                      placeholder="Any special requests or notes..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" size="lg" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  disabled={!formDataState.name || !formDataState.email || !formDataState.phone}
                  onClick={handleNext}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === "confirm" && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-serif font-semibold text-foreground mb-2 text-center">
                Confirm Your Booking
              </h2>
              <p className="text-muted-foreground text-center mb-8">
                Please review your appointment details before confirming
              </p>

              <div className="max-w-2xl mx-auto glass-card rounded-2xl p-8">
                <h3 className="font-serif text-xl font-semibold text-foreground mb-6">Booking Summary</h3>

                <div className="space-y-3">
                  <div className="py-3 border-b border-border">
                    <span className="text-muted-foreground text-sm">Services</span>
                    <div className="mt-2 space-y-2">
                      {selectedServices.map((service) => (
                        <div key={service.id} className="flex justify-between">
                          <span className="text-foreground">{service.name}</span>
                          <span className="text-muted-foreground">₱{service.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Specialist</span>
                    <span className="font-semibold text-foreground">{selectedStaffMember?.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-semibold text-foreground">
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-semibold text-foreground">
                      {selectedTime && timeSlots.find((slot) => slot.value === selectedTime)?.display}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground">Total Duration</span>
                    <span className="font-semibold text-foreground">{totalDuration} minutes</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-muted-foreground">Total Price</span>
                    <span className="font-semibold text-primary text-xl">₱{totalPrice}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3">Contact Details</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Name:</span> {formDataState.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Email:</span> {formDataState.email}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Phone:</span> {formDataState.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8 max-w-2xl mx-auto">
                <Button variant="outline" size="lg" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  variant="hero"
                  size="lg"
                  disabled={submitting}
                  onClick={async () => {
                    if (!user) {
                      toast.error("Please login to book an appointment")
                      navigate("/auth")
                      return
                    }

                    setSubmitting(true)

                    try {
                      // Get client ID for this user
                      const { data: clientData, error: clientError } = await supabase
                        .from("clients")
                        .select("id")
                        .eq("user_id", user.id)
                        .single()

                      let clientId = clientData?.id

                      // If no client exists, create one
                      if (!clientId) {
                        const { data: newClient, error: createError } = await supabase
                          .from("clients")
                          .insert([
                            {
                              user_id: user.id,
                              name: formDataState.name,
                              email: formDataState.email,
                              phone: formDataState.phone,
                            },
                          ])
                          .select()
                          .single()

                        if (createError) throw createError
                        clientId = newClient.id
                      }

                      const [hours, minutes] = selectedTime!.split(":").map(Number)
                      const endMinutes = hours * 60 + minutes + totalDuration
                      const endHours = Math.floor(endMinutes / 60)
                      const endMins = endMinutes % 60
                      const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

                      if (!selectedStaff) {
                        toast.error("No staff selected")
                        setSubmitting(false)
                        return
                      }

                      const result = await createAppointment({
                        client_id: clientId,
                        staff_id: selectedStaff,
                        service_ids: selectedServices.map((s) => s.id),
                        appointment_date: format(selectedDate!, "yyyy-MM-dd"),
                        start_time: selectedTime!,
                        end_time: endTime,
                        total_duration: totalDuration,
                        total_price: totalPrice,
                        notes: formDataState.notes || undefined,
                        status: "confirmed", 
                      })

                      if (result.success) {
                        navigate("/")
                      }
                    } catch (error: any) {
                      toast.error(error.message || "Failed to book appointment")
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  {submitting ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingPage
