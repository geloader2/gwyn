"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { useAuth } from "./useAuth"

export interface ClientAppointment {
  id: string
  client_id: string
  staff_id: string
  service_ids: string[]
  appointment_date: string
  start_time: string
  end_time: string
  total_duration: number
  total_price: number
  status: string
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  client_name?: string
  staff_name?: string
  staff_avatar_url?: string
  service_names?: string[]
}

export const useClientAppointments = () => {
  const [appointments, setAppointments] = useState<ClientAppointment[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchAppointments = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      // Get client ID for this user
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("id, name")
        .eq("user_id", user.id)
        .single()

      if (clientError || !clientData) {
        setAppointments([])
        setLoading(false)
        return
      }

      // Fetch appointments for this client
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientData.id)
        .order("appointment_date", { ascending: false })

      if (appointmentsError) throw appointmentsError

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([])
        setLoading(false)
        return
      }

      // Get unique staff and service IDs
      const staffIds = [...new Set(appointmentsData.map((a) => a.staff_id))]
      const allServiceIds = [...new Set(appointmentsData.flatMap((a) => a.service_ids))]

      // Fetch staff
      const { data: staffData } = await supabase.from("staff").select("id, name, avatar_url").in("id", staffIds)

      // Fetch services
      const { data: services } = await supabase.from("services").select("id, name").in("id", allServiceIds)

      // Map data
      const staffMap = new Map(staffData?.map((s) => [s.id, { name: s.name, avatar_url: s.avatar_url }]) || [])
      const serviceMap = new Map(services?.map((s) => [s.id, s.name]) || [])

      const enrichedAppointments: ClientAppointment[] = appointmentsData.map((apt) => ({
        ...apt,
        client_name: clientData.name,
        staff_name: staffMap.get(apt.staff_id)?.name || "Unknown Staff",
        staff_avatar_url: staffMap.get(apt.staff_id)?.avatar_url || null,
        service_names: apt.service_ids.map((id: string) => serviceMap.get(id) || "Unknown Service"),
      }))

      setAppointments(enrichedAppointments)
    } catch (error: any) {
      toast.error("Failed to load appointments")
      console.error("Error fetching appointments:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointment = async (
    id: string,
    data: { appointment_date: string; start_time: string; end_time: string },
  ) => {
    try {
      const { error } = await supabase.from("appointments").update(data).eq("id", id)

      if (error) throw error

      toast.success("Appointment rescheduled successfully")
      await fetchAppointments()
      return { success: true }
    } catch (error: any) {
      toast.error(error.message || "Failed to reschedule appointment")
      return { success: false, error }
    }
  }

  const cancelAppointment = async (id: string) => {
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id)

      if (error) throw error

      toast.success("Appointment cancelled successfully")
      await fetchAppointments()
      return { success: true }
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel appointment")
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchAppointments()

    // Subscribe to realtime changes
    const channel = supabase
      .channel("client-appointments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchAppointments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    appointments,
    loading,
    updateAppointment,
    cancelAppointment,
    refetch: fetchAppointments,
  }
}
