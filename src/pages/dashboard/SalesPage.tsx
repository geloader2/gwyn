"use client"

import { useState } from "react"
import { DollarSign, TrendingUp, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSales } from "@/hooks/useSales"
import { format, parseISO } from "date-fns"

const SalesPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const { sales, loading, stats } = useSales()

  const filteredSales = sales.filter(
    (sale) =>
      sale.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.service_names?.some((name) => name.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
          <p className="text-3xl font-serif font-semibold text-foreground">₱{stats.totalRevenue.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Total Revenue</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <Calendar className="h-6 w-6 text-accent-foreground" />
            </div>
          </div>
          <p className="text-3xl font-serif font-semibold text-foreground">{stats.totalSales}</p>
          <p className="text-muted-foreground text-sm">Total Sales</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <p className="text-3xl font-serif font-semibold text-foreground">₱{stats.averageSale.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Average Sale</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-serif font-semibold text-foreground">₱{stats.todayRevenue.toLocaleString()}</p>
          <p className="text-muted-foreground text-sm">Today's Revenue</p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-xl font-semibold text-foreground">Sales Records</h2>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No sales records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Services</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Staff</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Payment Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4 text-muted-foreground">
                      {format(parseISO(sale.created_at), "MMM d, yyyy h:mm a")}
                    </td>
                    <td className="p-4 font-medium text-foreground">{sale.client_name}</td>
                    <td className="p-4 text-muted-foreground">{sale.service_names?.join(", ")}</td>
                    <td className="p-4 text-muted-foreground">{sale.staff_name}</td>
                    <td className="p-4 text-right font-semibold text-primary">₱{sale.amount.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesPage
