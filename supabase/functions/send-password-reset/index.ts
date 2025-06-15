
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
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
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

    // Get client IP for rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    let clientIP = 'unknown';
    
    if (forwardedFor) {
      clientIP = forwardedFor.split(',')[0].trim();
    } else if (realIP) {
      clientIP = realIP.trim();
    }

    console.log('Client IP for rate limiting:', clientIP);

    // Check rate limits - but don't block if there are errors
    let shouldBlock = false;
    
    try {
      const [emailRateLimit, ipRateLimit] = await Promise.all([
        supabase.rpc('check_reset_rate_limit', { p_identifier: email }),
        supabase.rpc('check_reset_rate_limit', { p_identifier: clientIP })
      ]);

      console.log('Rate limit check results:', { 
        emailAllowed: emailRateLimit.data, 
        ipAllowed: ipRateLimit.data,
        emailError: emailRateLimit.error,
        ipError: ipRateLimit.error
      });

      // Only block if BOTH rate limit checks succeed AND BOTH return false
      if (!emailRateLimit.error && !ipRateLimit.error) {
        if (emailRateLimit.data === false && ipRateLimit.data === false) {
          shouldBlock = true;
        }
      }
    } catch (rateLimitError) {
      console.error('Rate limiting failed, allowing request to proceed:', rateLimitError);
    }

    if (shouldBlock) {
      return new Response(JSON.stringify({ 
        error: 'Too many reset attempts. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Use Supabase's built-in password reset functionality
    const origin = req.headers.get('origin') || 'https://4fe7e394-08f7-4784-94c8-57df2d2f4a95.lovableproject.com';
    const redirectUrl = `${origin}/reset-password`;
    
    console.log('Sending password reset email with redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('Error sending password reset:', error);
    } else {
      console.log('Password reset email sent successfully:', data);
    }

    // Always return success to prevent email enumeration
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
