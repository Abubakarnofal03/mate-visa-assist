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

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    if (!emailRateLimit.data || !ipRateLimit.data) {
      return new Response(JSON.stringify({ 
        error: 'Too many reset attempts. Please try again later.' 
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (userError || !userData.user) {
      // Always return success to prevent email enumeration
      return new Response(JSON.stringify({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userData.user.id,
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

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'VisaMate <noreply@resend.dev>', // Update with your verified domain
      to: [email],
      subject: 'Reset your VisaMate password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - VisaMate</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">VisaMate</h1>
              <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Your visa application management system</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
              
              <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.5;">
                We received a request to reset your password for your VisaMate account. Click the button below to create a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px 0 rgba(102, 126, 234, 0.25);">
                  Reset My Password
                </a>
              </div>
              
              <p style="color: #718096; margin: 20px 0; font-size: 14px; line-height: 1.5;">
                This link will expire in 15 minutes for security reasons. If you didn't request this password reset, you can safely ignore this email.
              </p>
              
              <div style="background-color: #f7fafc; border-left: 4px solid #4299e1; padding: 16px; margin: 20px 0;">
                <p style="color: #2d3748; margin: 0; font-size: 14px;">
                  <strong>Security tip:</strong> If you're having trouble clicking the button, copy and paste this link into your browser:
                </p>
                <p style="color: #4299e1; margin: 10px 0 0 0; font-size: 14px; word-break: break-all;">
                  ${resetUrl}
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f7fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #718096; margin: 0; font-size: 14px;">
                © 2024 VisaMate. All rights reserved.
              </p>
              <p style="color: #a0aec0; margin: 10px 0 0 0; font-size: 12px;">
                This email was sent to ${email}. If you have questions, please contact our support team.
              </p>
            </div>
          </div>
        </body>
        </html>
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

    return new Response(JSON.stringify({ 
      message: 'If an account with that email exists, a password reset link has been sent.' 
    }), {
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