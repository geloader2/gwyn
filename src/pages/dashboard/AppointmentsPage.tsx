"use client"

import { useState } from "react"
import { Calendar, Filter, Search, CheckCircle, Plus, Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppointments, type AppointmentWithDetails } from "@/hooks/useAppointments"
import { useClientAppointments } from "@/hooks/useClientAppointments"
import { useAuth } from "@/hooks/useAuth"
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  parseISO,
  startOfMonth,
  endOfMonth,
  getDay,
  eachDayOfInterval,
} from "date-fns"
import { cn } from "@/lib/utils"
import { BookingDialog } from "@/components/dialogs/BookingDialog"
import { AppointmentDetailsDialog } from "@/components/dialogs/AppointmentDetailsDialog"
import { useIsMobile } from "@/hooks/use-mobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ViewMode = "day" | "week" | "month"

const AppointmentsPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [searchQuery, setSearchQuery] = useState("")
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [bookingDate, setBookingDate] = useState<Date | null>(null)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithDetails | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const isMobile = useIsMobile()
  const { role } = useAuth()
  const { appointments: adminAppointments, loading: adminLoading, refetch: adminRefetch } = useAppointments()
  const { appointments: clientAppointments, loading: clientLoading, refetch: clientRefetch } = useClientAppointments()
  const appointments = role === "client" ? clientAppointments : adminAppointments
  const loading = role === "client" ? clientLoading : adminLoading
  const refetch = role === "client" ? clientRefetch : adminRefetch

  console.log("[v0] Appointments loaded:", appointments?.length, "Loading:", loading, "Role:", role)

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Only show confirmed appointments in calendar
  const getAppointmentsForDate = (date: Date) => {
    if (!appointments || !Array.isArray(appointments)) {
      console.log("[v0] No appointments array available")
      return []
    }
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.appointment_date)
      return isSameDay(aptDate, date) && apt.status === "confirmed"
    })
  }

  const formatDate = (date: Date) => {
    if (isMobile) {
      return format(date, "MMM d, yyyy")
    }
    return date.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  }

  // Filter appointments for the table view (includes all statuses)
  const filteredAppointments = (appointments || []).filter(
    (apt) =>
      apt.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.service_names?.some((name) => name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfMonth = getDay(monthStart)
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const calendarDays = [
    ...Array.from({ length: paddingDays }, (_, i) => addDays(monthStart, -(paddingDays - i))),
    ...monthDays,
  ]

  const handleDayClick = (date: Date) => {
    setBookingDate(date)
    setBookingDialogOpen(true)
  }

  const handleAppointmentClick = (apt: AppointmentWithDetails) => {
    setSelectedAppointment(apt)
    setDetailsDialogOpen(true)
  }

  const handleCheckout = () => {
    refetch()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const handleBookingComplete = () => {
    console.log("[v0] Refreshing appointments after booking")
    refetch()
  }
  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
          <Button
            variant="default"
            size={isMobile ? "sm" : "sm"}
            onClick={() => handleDayClick(new Date())}
            className={cn("flex items-center gap-2", isMobile && "flex-1")}
          >
            <Plus className="h-3 w-3 md:h-4 md:w-4" />
            {!isMobile && "New Booking"}
          </Button>
        </div>

        <div className="flex items-center justify-between md:justify-normal gap-2 md:gap-3 mt-2 md:mt-0">
          <h3 className={cn("font-bold text-slate-800 flex items-center gap-2", isMobile ? "text-base" : "text-xl")}>
            {formatDate(selectedDate)}
          </h3>

          {isMobile ? (
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex rounded-lg border border-border overflow-hidden">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors capitalize",
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile date navigation */}
      {isMobile && (
        <div className="flex items-center justify-between bg-card p-2 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (viewMode === "day") setSelectedDate(addDays(selectedDate, -1))
              else if (viewMode === "week") setSelectedDate(addDays(selectedDate, -7))
              else setSelectedDate(addDays(selectedDate, -30))
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date())}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (viewMode === "day") setSelectedDate(addDays(selectedDate, 1))
              else if (viewMode === "week") setSelectedDate(addDays(selectedDate, 7))
              else setSelectedDate(addDays(selectedDate, 30))
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Week View Calendar */}
      {viewMode === "week" && (
        <div className="glass-card rounded-lg md:rounded-2xl overflow-hidden">
          <div className={cn("grid border-b border-border", isMobile ? "grid-cols-7 text-xs" : "grid-cols-7")}>
            {weekDays.map((day, index) => (
              <div
                key={index}
                className={cn(
                  "p-2 md:p-4 text-center border-r border-border last:border-r-0",
                  isSameDay(day, new Date()) && "bg-primary/5",
                )}
              >
                <p className="text-xs text-muted-foreground mb-1">{format(day, "EEE")}</p>
                <p
                  className={cn(
                    "text-sm md:text-lg font-semibold",
                    isSameDay(day, new Date()) ? "text-primary" : "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {weekDays.map((day, dayIndex) => {
              const dayAppointments = getAppointmentsForDate(day)

              return (
                <div
                  key={dayIndex}
                  className={cn(
                    "p-1 md:p-2 border-r border-border last:border-r-0 min-h-[150px] md:min-h-[300px] cursor-pointer hover:bg-muted/50 transition-colors relative",
                    isSameDay(day, new Date()) && "bg-primary/5",
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Add booking button overlay */}
                  {dayAppointments.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-primary/5">
                      <Button
                        variant="ghost"
                        size={isMobile ? "icon" : "sm"}
                        className={cn("flex items-center gap-1 md:gap-2", isMobile && "h-6 w-6")}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDayClick(day)
                        }}
                      >
                        <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        {!isMobile && "Add"}
                      </Button>
                    </div>
                  )}

                  <div className="space-y-1 md:space-y-2">
                    {dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="rounded p-1 md:p-2 text-xs border-l-2 md:border-l-4 border-green-500 bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAppointmentClick(apt)
                        }}
                      >
                        <div className="flex items-center justify-between mb-0.5 md:mb-1">
                          <div className="flex items-center gap-1">
                            {apt.staff_avatar_url && !isMobile && (
                              <img
                                src={apt.staff_avatar_url || "/placeholder.svg"}
                                alt={apt.staff_name}
                                className="w-3 h-3 md:w-4 md:h-4 rounded-full object-cover"
                              />
                            )}
                            <p className="font-medium text-foreground truncate text-[10px] md:text-xs">
                              {isMobile ? apt.client_name?.split(" ")[0] : apt.client_name}
                            </p>
                          </div>
                          {!isMobile && <CheckCircle className="h-2 w-2 md:h-3 md:w-3 text-green-500" />}
                        </div>
                        <p className="text-muted-foreground truncate text-[10px] md:text-xs">
                          {isMobile ? apt.service_names?.[0] : apt.service_names?.join(", ")}
                        </p>
                        <p className="text-muted-foreground text-[10px]">{apt.start_time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === "day" && (
        <div className="glass-card rounded-lg md:rounded-2xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className={cn("font-serif font-semibold text-foreground", isMobile ? "text-base" : "text-xl")}>
              {format(selectedDate, isMobile ? "MMM d, yyyy" : "EEEE, MMMM d, yyyy")}
            </h2>
            {!isMobile && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -1))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-3 md:space-y-4">
            {getAppointmentsForDate(selectedDate).length === 0 ? (
              <div
                className="text-center py-8 md:py-12 border-2 border-dashed border-border rounded-lg md:rounded-xl cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleDayClick(selectedDate)}
              >
                <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-4" />
                <p className="text-muted-foreground mb-2 md:mb-4 text-sm md:text-base">No appointments for this day</p>
                <Button
                  variant="outline"
                  size={isMobile ? "sm" : "sm"}
                  className="flex items-center gap-1 md:gap-2 mx-auto bg-transparent"
                >
                  <Plus className="h-3 w-3 md:h-4 md:w-4" />
                  Add Booking
                </Button>
              </div>
            ) : (
              <>
                {getAppointmentsForDate(selectedDate).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center gap-2 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => handleAppointmentClick(apt)}
                  >
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      {apt.staff_avatar_url && !isMobile && (
                        <img
                          src={apt.staff_avatar_url || "/placeholder.svg"}
                          alt={apt.staff_name}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 md:gap-2">
                          <p className="font-medium text-foreground text-sm md:text-base truncate">{apt.client_name}</p>
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-500 flex-shrink-0" />
                        </div>
                        <p className="text-muted-foreground text-xs md:text-sm truncate">
                          {apt.service_names?.join(", ")} • {apt.staff_name}
                        </p>
                        <p className="text-muted-foreground text-xs mt-0.5 md:mt-1">
                          {apt.start_time} - {apt.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-foreground">₱{apt.total_price}</p>
                    </div>
                  </div>
                ))}
                {/* Add booking button at the bottom */}
                <div className="pt-3 md:pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="w-full flex items-center justify-center gap-1 md:gap-2 bg-transparent"
                    onClick={() => handleDayClick(selectedDate)}
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    Add Another Booking
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Month View */}
      {viewMode === "month" && (
        <div className="glass-card rounded-lg md:rounded-2xl p-3 md:p-6">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className={cn("font-serif font-semibold text-foreground", isMobile ? "text-base" : "text-xl")}>
              {format(selectedDate, "MMMM yyyy")}
            </h2>
            {!isMobile && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, -30))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDate(addDays(selectedDate, 30))}>
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
              <div key={index} className="text-center text-xs md:text-sm font-medium text-muted-foreground p-1 md:p-2">
                {isMobile ? day : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
              </div>
            ))}

            {calendarDays.map((day, index) => {
              const dayAppointments = getAppointmentsForDate(day)
              const isCurrentMonth = day >= monthStart && day <= monthEnd
              const isToday = isSameDay(day, new Date())

              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[60px] md:min-h-[100px] p-1 md:p-2 rounded border border-border text-left transition-all hover:shadow-sm md:hover:shadow-md hover:border-primary/50 relative",
                    !isCurrentMonth && "opacity-40",
                    isToday && "bg-primary/10 border-primary",
                    "cursor-pointer",
                  )}
                >
                  <p
                    className={cn(
                      "text-xs md:text-sm font-medium mb-0.5 md:mb-1",
                      isToday ? "text-primary" : "text-foreground",
                    )}
                  >
                    {format(day, "d")}
                  </p>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayAppointments.slice(0, isMobile ? 1 : 2).map((apt) => (
                      <div
                        key={apt.id}
                        className="text-[10px] md:text-xs p-0.5 md:p-1 rounded bg-green-500/20 border-l border-l-green-500 truncate hover:bg-green-500/30"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAppointmentClick(apt)
                        }}
                      >
                        <div className="flex items-center gap-0.5 md:gap-1">
                          <CheckCircle className="h-1.5 w-1.5 md:h-2 md:w-2 text-green-600 flex-shrink-0" />
                          <span className="truncate">
                            {isMobile ? apt.start_time : `${apt.start_time} ${apt.client_name?.split(" ")[0]}`}
                          </span>
                        </div>
                      </div>
                    ))}
                    {dayAppointments.length > (isMobile ? 1 : 2) && (
                      <p className="text-[10px] md:text-xs text-muted-foreground">
                        +{dayAppointments.length - (isMobile ? 1 : 2)} more
                      </p>
                    )}
                    {dayAppointments.length === 0 && (
                      <div className="opacity-0 hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center bg-black/5 rounded">
                        <Plus className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Appointment List */}
      <div className="glass-card rounded-lg md:rounded-2xl p-3 md:p-6">
        <h2 className={cn("font-serif font-semibold text-foreground mb-4 md:mb-6", isMobile ? "text-lg" : "text-xl")}>
          All Appointments
        </h2>
        {isMobile && (
          <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="md:hidden">
            <Menu className="h-4 w-4" />
          </Button>
        )}

        <div className="relative flex-1 md:flex-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search appointments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
              isMobile ? "w-full text-sm" : "w-64",
            )}
          />
        </div>

        {(!isMobile || showFilters) && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size={isMobile ? "sm" : "sm"} className={cn(isMobile && "flex-1")}>
              <Filter className="h-3 w-3 md:h-4 md:w-4 mr-2" />
              Filter
            </Button>
          </div>
        )}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-8 md:py-12">
            <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground mx-auto mb-2 md:mb-4" />
            <p className="text-muted-foreground">No appointments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Service
                  </th>
                  <th className="text-left p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Staff
                  </th>
                  <th className="text-left p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">Price</th>
                  <th className="text-center p-2 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleAppointmentClick(apt)}
                  >
                    <td className="p-2 md:p-4 font-medium text-foreground text-sm">
                      <div className="flex flex-col">
                        <span>{apt.client_name}</span>
                        <span className="text-xs text-muted-foreground md:hidden">{apt.service_names?.join(", ")}</span>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-muted-foreground hidden md:table-cell">
                      {apt.service_names?.join(", ")}
                    </td>
                    <td className="p-2 md:p-4 hidden sm:table-cell">
                      <div className="flex items-center gap-1 md:gap-2">
                        {apt.staff_avatar_url && (
                          <img
                            src={apt.staff_avatar_url || "/placeholder.svg"}
                            alt={apt.staff_name}
                            className="w-4 h-4 md:w-6 md:h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-muted-foreground text-xs md:text-sm">{apt.staff_name}</span>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-muted-foreground text-xs md:text-sm">
                      {format(parseISO(apt.appointment_date), isMobile ? "MMM d" : "MMM d, yyyy")}
                      {isMobile && <div className="text-xs">{apt.start_time}</div>}
                    </td>
                    <td className="p-2 md:p-4">
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-0.5 rounded-full text-xs font-medium ${
                            apt.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : apt.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : apt.status === "completed"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {apt.status === "confirmed" && <CheckCircle className="h-2 w-2 md:h-3 md:w-3 mr-1" />}
                          <span className="truncate">{isMobile ? apt.status.charAt(0).toUpperCase() : apt.status}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-2 md:p-4 text-right font-medium text-foreground text-sm md:text-base">
                      ₱{apt.total_price}
                    </td>
                    <td className="p-2 md:p-4 text-center">
                      <Button
                        variant="outline"
                        size={isMobile ? "sm" : "sm"}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAppointmentClick(apt)
                        }}
                      >
                        {isMobile ? "View" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <BookingDialog
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
        preselectedDate={bookingDate}
        onBookingComplete={handleBookingComplete}
      />

      <AppointmentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        appointment={selectedAppointment}
        onCheckout={handleCheckout}
      />

      {/* Mobile FAB */}
      {isMobile && (
        <Button
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50"
          onClick={() => handleDayClick(new Date())}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}

export default AppointmentsPage
