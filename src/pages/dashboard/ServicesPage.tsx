"use client"

import { useState } from "react"
import { Search, Plus, Clock, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useServices, type Service, type ServiceFormData } from "@/hooks/useServices"
import { ServiceDialog } from "@/components/dialogs/ServiceDialog"
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog"
import { useAuth } from "@/hooks/useAuth"

const ServicesPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deleteService, setDeleteService] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { services, categories, loading, createService, updateService, deleteService: removeService } = useServices()
  const { role } = useAuth()

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAdd = () => {
    setEditingService(null)
    setDialogOpen(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: ServiceFormData) => {
    if (editingService) {
      return updateService(editingService.id, data)
    }
    return createService(data)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteService) return
    setDeleting(true)
    await removeService(deleteService.id)
    setDeleting(false)
    setDeleteService(null)
  }

  const canEdit = role !== "client"

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
        {canEdit && (
          <Button variant="default" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              !selectedCategory
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-muted",
            )}
          >
            All Services
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">{services.length}</p>
          <p className="text-muted-foreground text-sm">Total Services</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">{categories.length}</p>
          <p className="text-muted-foreground text-sm">Categories</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">
            ₱
            {services.length > 0
              ? Math.round(services.reduce((sum, s) => sum + Number(s.price), 0) / services.length)
              : 0}
          </p>
          <p className="text-muted-foreground text-sm">Avg. Price</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">
            {services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.duration, 0) / services.length) : 0}
          </p>
          <p className="text-muted-foreground text-sm">Avg. Duration (min)</p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-4 lg:grid-cols-4 gap-6">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                  {service.category}
                </span>
                <h3 className="font-serif text-xl font-semibold text-foreground mt-3">{service.name}</h3>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full mr-2",
                      service.is_active
                        ? "bg-[hsl(var(--status-confirmed)/0.15)] text-[hsl(var(--status-confirmed))]"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => setDeleteService(service)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{service.description || "No description"}</p>

            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {service.duration} min
              </div>
              <span className="text-sm font-semibold text-foreground">
                {Number(service.price) === 0 ? "Free" : `₱${service.price}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">
            {services.length === 0
              ? "No services yet. Add your first service to get started."
              : "No services found matching your criteria."}
          </p>
        </div>
      )}

      {canEdit && (
        <>
          <ServiceDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            service={editingService}
            onSubmit={handleSubmit}
          />

          <DeleteConfirmDialog
            open={!!deleteService}
            onOpenChange={(open) => !open && setDeleteService(null)}
            title="Delete Service"
            description={`Are you sure you want to delete "${deleteService?.name}"? This action cannot be undone.`}
            onConfirm={handleDeleteConfirm}
            loading={deleting}
          />
        </>
      )}
    </div>
  )
}

export default ServicesPage
