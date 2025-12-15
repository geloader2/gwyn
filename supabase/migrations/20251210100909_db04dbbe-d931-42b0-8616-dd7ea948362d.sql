
-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'General',
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff table
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  title TEXT NOT NULL DEFAULT 'Specialist',
  bio TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff_services junction table
CREATE TABLE public.staff_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id, service_id)
);

-- Create working_hours table
CREATE TABLE public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL DEFAULT '09:00',
  end_time TIME NOT NULL DEFAULT '17:00',
  is_working BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(staff_id, day_of_week)
);

-- Enable RLS on all tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- Services policies (viewable by all authenticated, editable by admin/staff)
CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all services" ON public.services
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

-- Staff policies
CREATE POLICY "Admins can manage staff" ON public.staff
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view all staff" ON public.staff
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update own profile" ON public.staff
  FOR UPDATE USING (user_id = auth.uid());

-- Clients policies
CREATE POLICY "Admins can manage clients" ON public.clients
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff can view and update clients" ON public.clients
  FOR SELECT USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can update clients" ON public.clients
  FOR UPDATE USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view own profile" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Clients can update own profile" ON public.clients
  FOR UPDATE USING (user_id = auth.uid());

-- Staff services policies
CREATE POLICY "Anyone authenticated can view staff services" ON public.staff_services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage staff services" ON public.staff_services
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Working hours policies
CREATE POLICY "Anyone authenticated can view working hours" ON public.working_hours
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage working hours" ON public.working_hours
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add triggers for updated_at
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
