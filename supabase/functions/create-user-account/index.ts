import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleData?.role !== "admin") {
      throw new Error("Only admins can create user accounts");
    }

    const { email, password, fullName, phone, userType, additionalData } = await req.json();

    if (!email || !password || !userType) {
      throw new Error("Email, password, and userType are required");
    }

    // Create the auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone }
    });

    if (createError) {
      throw createError;
    }

    const userId = newUser.user.id;

    // Create profile
    await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      full_name: fullName,
      email,
      phone
    });

    // Assign role based on userType
    const role = userType === "staff" ? "staff" : "client";
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role
    });

    // Create the specific record (client or staff)
    if (userType === "client") {
      await supabaseAdmin.from("clients").insert({
        user_id: userId,
        name: fullName || "New Client",
        email,
        phone,
        date_of_birth: additionalData?.date_of_birth || null,
        notes: additionalData?.notes || null
      });
    } else if (userType === "staff") {
      await supabaseAdmin.from("staff").insert({
        user_id: userId,
        name: fullName || "New Staff",
        email,
        phone,
        title: additionalData?.title || "Specialist",
        bio: additionalData?.bio || null,
        is_active: additionalData?.is_active ?? true,
        avatar_url: additionalData?.avatar_url || null
      });
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
