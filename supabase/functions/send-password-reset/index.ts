
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    console.log('Password reset request for email:', email);

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get client IP for basic rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limits for both email and IP
    const [emailRateLimit, ipRateLimit] = await Promise.all([
      supabase.rpc('check_reset_rate_limit', { p_identifier: email }),
      supabase.rpc('check_reset_rate_limit', { p_identifier: clientIP })
    ]);

    console.log('Rate limit check results:', { emailRateLimit: emailRateLimit.data, ipRateLimit: ipRateLimit.data });

    // Block only if BOTH email and IP are rate limited, or if there's an error with the checks
    if (emailRateLimit.error || ipRateLimit.error) {
      console.error('Rate limit check errors:', { emailError: emailRateLimit.error, ipError: ipRateLimit.error });
      return new Response(JSON.stringify({ 
        error: 'Service temporarily unavailable. Please try again later.' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Only block if both email AND IP are rate limited (both return false)
    if (!emailRateLimit.data && !ipRateLimit.data) {
      return new Response(JSON.stringify({ 
        error: 'Too many reset attempts. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Use Supabase's built-in password reset functionality
    const redirectUrl = `${req.headers.get('origin') || 'https://your-app.com'}/reset-password`;
    
    console.log('Sending password reset email using Supabase auth...');

    const { error } = await supabase.auth.admin.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Error sending password reset:', error);
      // Still return success message to prevent email enumeration
      return new Response(JSON.stringify({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Password reset email sent successfully via Supabase auth');

    return new Response(JSON.stringify({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-password-reset function:', error);
    return new Response(JSON.stringify({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
