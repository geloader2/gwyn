import { useState } from 'react';
import { Search, Plus, Mail, Phone, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStaff, Staff, StaffFormData } from '@/hooks/useStaff';
import { StaffDialog } from '@/components/dialogs/StaffDialog';
import { DeleteConfirmDialog } from '@/components/dialogs/DeleteConfirmDialog';

const StaffPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteStaffMember, setDeleteStaffMember] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { staff, loading, createStaff, updateStaff, deleteStaff } = useStaff();

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setEditingStaff(null);
    setDialogOpen(true);
  };

  const handleEdit = (member: Staff) => {
    setEditingStaff(member);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: StaffFormData) => {
    if (editingStaff) {
      return updateStaff(editingStaff.id, data);
    }
    return createStaff(data);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteStaffMember) return;
    setDeleting(true);
    await deleteStaff(deleteStaffMember.id);
    setDeleting(false);
    setDeleteStaffMember(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-foreground w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <Button variant="default" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">{staff.length}</p>
          <p className="text-muted-foreground text-sm">Total Staff</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">
            {staff.filter(s => s.is_active).length}
          </p>
          <p className="text-muted-foreground text-sm">Active Members</p>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <p className="text-3xl font-serif font-semibold text-foreground">
            {staff.filter(s => !s.is_active).length}
          </p>
          <p className="text-muted-foreground text-sm">Inactive Members</p>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => (
          <div 
            key={member.id}
            className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 group"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden">
                {member.avatar_url ? (
                  <img 
                    src={member.avatar_url} 
                    alt={member.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-semibold text-accent-foreground">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        member.is_active 
                          ? "bg-[hsl(var(--status-confirmed)/0.15)] text-[hsl(var(--status-confirmed))]"
                          : "bg-muted text-muted-foreground"
                      )}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-primary font-medium">{member.title}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleEdit(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteStaffMember(member)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            {member.bio && (
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{member.bio}</p>
            )}

            {/* Contact */}
            <div className="space-y-2">
              <p className="text-sm flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{member.email}</span>
              </p>
              {member.phone && (
                <p className="text-sm flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {member.phone}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredStaff.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-muted-foreground">
            {staff.length === 0 
              ? 'No staff members yet. Add your first staff member to get started.'
              : 'No staff members found matching your search.'}
          </p>
        </div>
      )}

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editingStaff}
        onSubmit={handleSubmit}
      />

      <DeleteConfirmDialog
        open={!!deleteStaffMember}
        onOpenChange={(open) => !open && setDeleteStaffMember(null)}
        title="Delete Staff Member"
        description={`Are you sure you want to delete "${deleteStaffMember?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        loading={deleting}
      />
    </div>
  );
};

export default StaffPage;
