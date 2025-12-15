import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  is_active: boolean;
}

export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set((data || []).map(s => s.category))];
      setCategories(uniqueCategories);
    } catch (error: any) {
      toast.error('Failed to load services');
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const createService = async (formData: ServiceFormData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      setServices(prev => [...prev, data]);
      toast.success('Service created successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to create service');
      return { success: false, error };
    }
  };

  const updateService = async (id: string, formData: ServiceFormData) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setServices(prev => prev.map(s => s.id === id ? data : s));
      toast.success('Service updated successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to update service');
      return { success: false, error };
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServices(prev => prev.filter(s => s.id !== id));
      toast.success('Service deleted successfully');
      return { success: true };
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service');
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    categories,
    loading,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices,
  };
};
