"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

export interface Client {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  date_of_birth: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ClientFormData {
  name: string
  email: string
  phone: string
  date_of_birth: string | null
  notes: string
  password?: string
}

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase.from("clients").select("*").order("name")

      if (error) throw error
      setClients(data || [])
    } catch (error: unknown) {
      toast.error("Failed to load clients")
      console.error("Error fetching clients:", error)
    } finally {
      setLoading(false)
    }
  }

  const createClient = async (formData: ClientFormData) => {
    try {
      // If password is provided, create user account via edge function
      if (formData.password && formData.password.length >= 6) {
        const { data: sessionData } = await supabase.auth.getSession()
        if (!sessionData.session) {
          throw new Error("You must be logged in to create clients")
        }

        const response = await supabase.functions.invoke("create-user-account", {
          body: {
            email: formData.email,
            password: formData.password,
            fullName: formData.name,
            phone: formData.phone,
            userType: "client",
            additionalData: {
              date_of_birth: formData.date_of_birth,
              notes: formData.notes,
            },
          },
        })

        if (response.error) {
          throw new Error(response.error.message || "Failed to create user account")
        }

        if (response.data?.error) {
          throw new Error(response.data.error)
        }

        await fetchClients()
        toast.success("Client account created successfully")
        return { success: true }
      }

      // Create client without user account
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            date_of_birth: formData.date_of_birth || null,
            notes: formData.notes || null,
          },
        ])
        .select()
        .single()

      if (error) throw error
      setClients((prev) => [...prev, data])
      toast.success("Client created successfully")
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create client"
      toast.error(message)
      return { success: false, error }
    }
  }

  const updateClient = async (id: string, formData: ClientFormData) => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .update({
          name: formData.name,
          phone: formData.phone || null,
          date_of_birth: formData.date_of_birth || null,
          notes: formData.notes || null,
        })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error
      setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
      toast.success("Client updated successfully")
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update client"
      toast.error(message)
      return { success: false, error }
    }
  }

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase.from("clients").delete().eq("id", id)

      if (error) throw error
      setClients((prev) => prev.filter((c) => c.id !== id))
      toast.success("Client deleted successfully")
      return { success: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete client"
      toast.error(message)
      return { success: false, error }
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  }
}
