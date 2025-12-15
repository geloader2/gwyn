import { useState } from "react"
import { Search, Plus, Mail, Phone, Calendar, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { useClients, type Client, type ClientFormData } from "@/hooks/useClients"
import { ClientDialog } from "@/components/dialogs/ClientDialog"
import { DeleteConfirmDialog } from "@/components/dialogs/DeleteConfirmDialog"
import { useAuth } from "@/hooks/useAuth"

const ClientsPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteClient, setDeleteClient] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { clients, loading, createClient, updateClient, deleteClient: removeClient } = useClients()
  const { role, loading: authLoading } = useAuth()

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleAdd = () => {
    setEditingClient(null)
    setDialogOpen(true)
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: ClientFormData) => {
    if (editingClient) {
      return updateClient(editingClient.id, data)
    }
    return createClient(data)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteClient) return
    setDeleting(true)
    await removeClient(deleteClient.id)
    setDeleting(false)
    setDeleteClient(null)
  }

  // Calculate stats
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const newThisMonth = clients.filter((c) => new Date(c.created_at) >= thisMonth).length

  if (authLoading || loading) {
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
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <Button variant="default" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">{clients.length}</p>
          <p className="text-muted-foreground text-sm">Total Clients</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">{newThisMonth}</p>
          <p className="text-muted-foreground text-sm">New This Month</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">{clients.length}</p>
          <p className="text-muted-foreground text-sm">Active Clients</p>
        </div>
      </div>

      {/* Client Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => (
          <div key={client.id} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center">
                <span className="text-lg font-semibold text-accent-foreground">
                  {client.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{client.email}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteClient(client)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {client.phone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </p>
              )}
              <p className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Joined {format(new Date(client.created_at), "MMM d, yyyy")}
              </p>
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground line-clamp-2">{client.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">
            {clients.length === 0
              ? "No clients yet. Add your first client to get started."
              : "No clients found matching your search."}
          </p>
        </div>
      )}

      <ClientDialog open={dialogOpen} onOpenChange={setDialogOpen} client={editingClient} onSubmit={handleSubmit} />

      <DeleteConfirmDialog
        open={!!deleteClient}
        onOpenChange={(open) => !open && setDeleteClient(null)}
        title="Delete Client"
        description={`Are you sure you want to delete "${deleteClient?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  )
}

export default ClientsPage
