import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { format } from "date-fns"

export interface Sale {
  id: string
  appointment_id: string
  client_id: string
  staff_id: string
  service_ids: string[]
  amount: number
  created_at: string
  // Joined data
  client_name?: string
  staff_name?: string
  service_names?: string[]
}

export const useSales = () => {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSales = async () => {
    try {
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })

      if (salesError) throw salesError

      if (!salesData || salesData.length === 0) {
        setSales([])
        setLoading(false)
        return
      }

      // Get unique client, staff, and service IDs
      const clientIds = [...new Set(salesData.map((s) => s.client_id))]
      const staffIds = [...new Set(salesData.map((s) => s.staff_id))]
      const allServiceIds = [...new Set(salesData.flatMap((s) => s.service_ids))]

      // Fetch related data
      const { data: clients } = await supabase.from("clients").select("id, name").in("id", clientIds)

      const { data: staffData } = await supabase.from("staff").select("id, name").in("id", staffIds)

      const { data: services } = await supabase.from("services").select("id, name").in("id", allServiceIds)

      // Create maps
      const clientMap = new Map(clients?.map((c) => [c.id, c.name]) || [])
      const staffMap = new Map(staffData?.map((s) => [s.id, s.name]) || [])
      const serviceMap = new Map(services?.map((s) => [s.id, s.name]) || [])

      const enrichedSales: Sale[] = salesData.map((sale) => ({
        ...sale,
        client_name: clientMap.get(sale.client_id) || "Unknown Client",
        staff_name: staffMap.get(sale.staff_id) || "Unknown Staff",
        service_names: sale.service_ids.map((id: string) => serviceMap.get(id) || "Unknown Service"),
      }))

      setSales(enrichedSales)
    } catch (error: any) {
      toast.error("Failed to load sales")
      console.error("Error fetching sales:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()

    // Subscribe to realtime changes
    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        fetchSales()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Calculate stats
  const stats = {
    totalRevenue: sales.reduce((sum, sale) => sum + Number(sale.amount), 0),
    totalSales: sales.length,
    averageSale: sales.length > 0 ? sales.reduce((sum, sale) => sum + Number(sale.amount), 0) / sales.length : 0,
    todayRevenue: sales
      .filter((sale) => format(new Date(sale.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
      .reduce((sum, sale) => sum + Number(sale.amount), 0),
  }

  return {
    sales,
    loading,
    stats,
    refetch: fetchSales,
  }
}
