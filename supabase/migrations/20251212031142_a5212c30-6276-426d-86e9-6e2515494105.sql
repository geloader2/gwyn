-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  service_ids UUID[] NOT NULL,
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_duration INTEGER NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all appointments"
ON public.appointments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view and update their appointments"
ON public.appointments
FOR SELECT
USING (
  has_role(auth.uid(), 'staff') OR 
  staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
);

CREATE POLICY "Staff can update their appointments"
ON public.appointments
FOR UPDATE
USING (
  has_role(auth.uid(), 'staff') AND 
  staff_id IN (SELECT id FROM public.staff WHERE user_id = auth.uid())
);

CREATE POLICY "Clients can view their own appointments"
ON public.appointments
FOR SELECT
USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

CREATE POLICY "Clients can create appointments"
ON public.appointments
FOR INSERT
WITH CHECK (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
);

CREATE POLICY "Clients can cancel their own appointments"
ON public.appointments
FOR UPDATE
USING (
  client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
)
WITH CHECK (
  status = 'cancelled'
);

-- Trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;