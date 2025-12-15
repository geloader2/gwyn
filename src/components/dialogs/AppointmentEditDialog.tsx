"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock } from "lucide-react"
import { format, addDays } from "date-fns"
import { cn } from "@/lib/utils"

interface AppointmentEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: any | null
  onSubmit: (id: string, data: { appointment_date: string; start_time: string; end_time: string }) => Promise<any>
}

export const AppointmentEditDialog = ({ open, onOpenChange, appointment, onSubmit }: AppointmentEditDialogProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + 1))
  const timeSlots = [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
    "17:00",
  ]

  useEffect(() => {
    if (appointment) {
      setSelectedDate(new Date(appointment.appointment_date))
      setSelectedTime(appointment.start_time)
    }
  }, [appointment])

  const handleSubmit = async () => {
    if (!appointment || !selectedDate || !selectedTime) return

    setSubmitting(true)

    // Calculate end time
    const [hours, minutes] = selectedTime.split(":").map(Number)
    const endMinutes = hours * 60 + minutes + appointment.total_duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    const endTime = `${String(endHours).padStart(2, "0")}:${String(endMins).padStart(2, "0")}`

    const result = await onSubmit(appointment.id, {
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: selectedTime,
      end_time: endTime,
    })

    setSubmitting(false)

    if (result.success) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Selection */}
          <div>
            <label className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Select New Date
            </label>
            <div className="flex gap-3 overflow-x-auto pb-4">
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
            <div>
              <label className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Select New Time
              </label>
              <div className="grid grid-cols-4 gap-3">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "p-3 rounded-lg text-center transition-all duration-200",
                      selectedTime === time
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border hover:border-primary/50",
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleSubmit} disabled={!selectedDate || !selectedTime || submitting}>
              {submitting ? "Rescheduling..." : "Reschedule Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
