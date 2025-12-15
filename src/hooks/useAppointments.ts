import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AppointmentWithDetails {
  id: string;
  client_id: string;
  staff_id: string;
  service_ids: string[];
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_duration: number;
  total_price: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client_name?: string;
  staff_name?: string;
  staff_avatar_url?: string;
  service_names?: string[];
}

export interface CreateAppointmentData {
  client_id: string;
  staff_id: string;
  service_ids: string[];
  appointment_date: string;
  start_time: string;
  end_time: string;
  total_duration: number;
  total_price: number;
  notes?: string;
  status?: string;
}

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    try {
      // Fetch appointments with related data
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false });

      if (appointmentsError) throw appointmentsError;

      if (!appointmentsData || appointmentsData.length === 0) {
        setAppointments([]);
        return;
      }

      // Get unique client and staff IDs
      const clientIds = [...new Set(appointmentsData.map(a => a.client_id))];
      const staffIds = [...new Set(appointmentsData.map(a => a.staff_id))];
      const allServiceIds = [...new Set(appointmentsData.flatMap(a => a.service_ids))];

      // Fetch clients
      const { data: clients } = await supabase
        .from('clients')
        .select('id, name')
        .in('id', clientIds);

      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, name, avatar_url')
        .in('id', staffIds);

      // Fetch services
      const { data: services } = await supabase
        .from('services')
        .select('id, name')
        .in('id', allServiceIds);

      // Map data
      const clientMap = new Map(clients?.map(c => [c.id, c.name]) || []);
      const staffMap = new Map(staffData?.map(s => [s.id, { name: s.name, avatar_url: s.avatar_url }]) || []);
      const serviceMap = new Map(services?.map(s => [s.id, s.name]) || []);

      const enrichedAppointments: AppointmentWithDetails[] = appointmentsData.map(apt => ({
        ...apt,
        client_name: clientMap.get(apt.client_id) || 'Unknown Client',
        staff_name: staffMap.get(apt.staff_id)?.name || 'Unknown Staff',
        staff_avatar_url: staffMap.get(apt.staff_id)?.avatar_url || null,
        service_names: apt.service_ids.map((id: string) => serviceMap.get(id) || 'Unknown Service'),
      }));

      setAppointments(enrichedAppointments);
    } catch (error: any) {
      toast.error('Failed to load appointments');
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (data: CreateAppointmentData) => {
    try {
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      toast.success('Appointment booked successfully!');
      await fetchAppointments();
      return { success: true, data: newAppointment };
    } catch (error: any) {
      toast.error(error.message || 'Failed to create appointment');
      return { success: false, error };
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      setAppointments(prev => prev.map(apt => 
        apt.id === id ? { ...apt, status } : apt
      ));
      toast.success('Appointment updated successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to update appointment');
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchAppointments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    appointments,
    loading,
    createAppointment,
    updateAppointmentStatus,
    refetch: fetchAppointments,
  };
};
