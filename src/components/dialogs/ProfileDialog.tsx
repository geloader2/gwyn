"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface ProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProfileDialog = ({ open, onOpenChange }: ProfileDialogProps) => {
  const { user, role } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const loadProfileData = async () => {
      if (!user || !open) return

      try {
        // Load user metadata
        setProfileData({
          full_name: user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: user.user_metadata?.phone || "",
        })

        // If client, also load client-specific data
        if (role === "client") {
          const { data: clientData } = await supabase
            .from("clients")
            .select("name, email, phone")
            .eq("user_id", user.id)
            .single()

          if (clientData) {
            setProfileData({
              full_name: clientData.name || user.user_metadata?.full_name || "",
              email: clientData.email || user.email || "",
              phone: clientData.phone || user.user_metadata?.phone || "",
            })
          }
        }

        // If staff, load staff-specific data
        if (role === "staff") {
          const { data: staffData } = await supabase
            .from("staff")
            .select("name, email, phone")
            .eq("user_id", user.id)
            .single()

          if (staffData) {
            setProfileData({
              full_name: staffData.name || user.user_metadata?.full_name || "",
              email: staffData.email || user.email || "",
              phone: staffData.phone || user.user_metadata?.phone || "",
            })
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
      }
    }

    loadProfileData()
  }, [user, role, open])

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
        },
      })

      if (authError) throw authError

      // Update client/staff table based on role
      if (role === "client") {
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            name: profileData.full_name,
            phone: profileData.phone,
          })
          .eq("user_id", user.id)

        if (clientError) throw clientError
      }

      if (role === "staff") {
        const { error: staffError } = await supabase
          .from("staff")
          .update({
            name: profileData.full_name,
            phone: profileData.phone,
          })
          .eq("user_id", user.id)

        if (staffError) throw staffError
      }

      toast.success("Profile updated successfully")
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile")
      console.error("Error updating profile:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={profileData.email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
