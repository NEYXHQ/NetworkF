import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Type declarations for Deno runtime
declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface WelcomeEmailRequest {
  to: string;
  subject: string;
  userName?: string;
}

// Email template functions
function getWelcomeEmailTemplate(userName?: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f2f2f2; padding: 20px;">
      <div style="background-color: #1e293b; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #f78c01; font-size: 28px; margin-bottom: 10px;">Welcome to WFounders!</h1>
        <h2 style="color: #2dd4bf; font-size: 20px; margin-top: 0;">Hello ${userName || 'Founder'}! 👋</h2>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Thank you for joining WFounders – the exclusive network for ambitious founders and entrepreneurs!
        </p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Your application is currently under review by our team. We carefully evaluate each founder to ensure the highest quality of our network.
        </p>
        
        <div style="background-color: #cefbf4; border-left: 4px solid #2dd4bf; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #0c6553; margin: 0 0 10px 0; font-size: 16px;">What happens next?</h3>
          <ul style="color: #10976f; margin: 0; padding-left: 20px;">
            <li>Our team will review your application</li>
            <li>You'll receive an approval notification via email</li>
            <li>Once approved, you'll gain access to our exclusive founder network</li>
          </ul>
        </div>
        

        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We're putting the finishing touches on our platform and will notify you as soon as your application is reviewed and the network launches.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:5174' : 'https://wfounders.vercel.app'}" style="background-color: #f78c01; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            Complete Your Profile
          </a>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
        <p style="margin: 0;">
          Best regards,<br>
          <strong style="color: #f78c01;">The WFounders Team</strong>
        </p>
        <p style="margin: 10px 0 0 0; font-size: 12px;">
          Building the future, one founder at a time.
        </p>
      </div>
    </div>
  `;
}





Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the request body
    const { to, subject, userName }: WelcomeEmailRequest = await req.json();

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Resend API key from environment variables
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send email using Resend API
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'World Founders <onboarding@wfounders.club>', // Update with your verified domain
        to: [to],
        subject: subject,
        html: getWelcomeEmailTemplate(userName),
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error('Resend API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: errorData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const emailResult = await emailResponse.json();
    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome email sent successfully',
        emailId: emailResult.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-welcome-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});