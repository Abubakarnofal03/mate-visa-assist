
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";
import { createHash, randomBytes } from "node:crypto";

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
    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const resend = new Resend(resendApiKey);
    const { email }: PasswordResetRequest = await req.json();

    console.log('Password reset request for email:', email);

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limits for both email and IP
    const [emailRateLimit, ipRateLimit] = await Promise.all([
      supabase.rpc('check_reset_rate_limit', { p_identifier: email }),
      supabase.rpc('check_reset_rate_limit', { p_identifier: clientIP })
    ]);

    console.log('Rate limit check results:', { emailRateLimit: emailRateLimit.data, ipRateLimit: ipRateLimit.data });

    if (!emailRateLimit.data || !ipRateLimit.data) {
      return new Response(JSON.stringify({ 
        error: 'Too many reset attempts. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Use the new function to safely find user by email
    const { data: userId, error: userError } = await supabase.rpc('find_user_by_email', { 
      p_email: email 
    });
    
    console.log('User lookup result:', { found: !!userId, error: userError });

    // For security, always return the same message regardless of whether user exists
    const successMessage = 'If an account with that email exists, a password reset link has been sent.';

    // If no user found, still return success to prevent email enumeration
    if (userError || !userId) {
      return new Response(JSON.stringify({ message: successMessage }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    console.log('Generated reset token for user:', userId);

    // Store reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: clientIP,
        user_agent: req.headers.get('user-agent') || null
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to process request' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Clean up expired tokens
    await supabase.rpc('cleanup_expired_reset_tokens');

    // Generate reset URL
    const resetUrl = `${req.headers.get('origin') || 'https://your-app.com'}/reset-password?token=${token}`;

    console.log('Sending password reset email to:', email);

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'VisaMate <onboarding@resend.dev>',
      to: [email],
      subject: 'Reset your VisaMate password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>We received a request to reset your password for your VisaMate account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>This link will expire in 15 minutes.</p>
          <p>If you didn't request this password reset, you can safely ignore this email.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">If you're having trouble clicking the button, copy and paste this link into your browser: ${resetUrl}</p>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error('Error sending email:', emailResponse.error);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Password reset email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ message: successMessage }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-password-reset function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
