-- Update the handle_new_user function to also create a client record
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.email
  );
  
  -- Assign client role by default for self-signup
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client');
  
  -- Also create a client record so they appear in Clients Page
  INSERT INTO public.clients (user_id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New Client'),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  
  RETURN NEW;
END;
$function$;