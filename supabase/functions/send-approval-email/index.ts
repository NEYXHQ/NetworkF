import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { corsHeaders } from '../_shared/cors.ts';

// Type declarations for Deno runtime
declare const Deno: {
  serve: (handler: (request: Request) => Response | Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

interface ApprovalEmailRequest {
  to: string;
  subject: string;
  userName?: string;
}

function getApprovalEmailTemplate(userName?: string): string {
  const displayName = userName || 'Founder';
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f2f2f2; padding: 20px;">
      <div style="background-color: #1e293b; padding: 30px; border-radius: 10px; text-align: center;">
        <h1 style="color: #f78c01; font-size: 28px; margin-bottom: 10px;">🎉 You're In!</h1>
        <h2 style="color: #2dd4bf; font-size: 20px; margin-top: 0;">Congratulations ${displayName}!</h2>
      </div>
      
      <div style="background-color: white; padding: 30px; border-radius: 10px; margin-top: 20px;">
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          <strong>Welcome to the WFounders founding community!</strong> Your application has been approved, and you're now part of an exclusive group of verified founders.
        </p>
        
        <div style="background-color: #fef3c7; border-left: 4px solid #f78c01; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🚀 You're a Founding Member!</h3>
          <p style="color: #b45309; margin: 0; font-size: 14px;">
            As one of our early approved founders, you'll have special privileges when the network officially launches.
          </p>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We're currently in our pre-launch phase, putting the final touches on our platform to ensure an exceptional experience for founders like you.
        </p>
        
        <div style="background-color: #cefbf4; border-left: 4px solid #2dd4bf; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <h3 style="color: #0c6553; margin: 0 0 10px 0; font-size: 16px;">What's next?</h3>
          <ul style="color: #10976f; margin: 0; padding-left: 20px; line-height: 1.6;">
            <li><strong>Platform Launch:</strong> You'll be among the first to access WFounders when we go live</li>
            <li><strong>Exclusive Updates:</strong> Receive insider updates on our progress and launch timeline</li>
            <li><strong>Founding Member Benefits:</strong> Special recognition and early access to new features</li>
            <li><strong>Network Access:</strong> Connect with other approved founders in our exclusive community</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We'll notify you as soon as the platform is ready for you to dive in and start building meaningful connections with fellow founders.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:5174' : 'https://wfounders.vercel.app'}" style="background-color: #f78c01; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
            Access WFounders Platform
          </a>
        </div>
        
        <div style="background-color: #f0f9ff; border: 1px solid #2dd4bf; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <p style="color: #0c6553; margin: 0; font-size: 16px; font-weight: bold;">
            🏆 Thank you for being part of our founding journey!
          </p>
        </div>
      </div>
      
      <div style="text-align: center; padding: 20px; color: #999; font-size: 14px;">
        <p style="margin: 0;">
          Welcome to the family,<br>
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
    return new Response('ok', { headers: corsHeaders })
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
      )
    }
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      return new Response(
        JSON.stringify({ error: 'Email service configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { to, subject, userName }: ApprovalEmailRequest = await req.json()

    if (!to || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Detect environment and add prefix for development emails
    const environment = Deno.env.get('ENVIRONMENT') || 'development'
    const isDevelopment = environment === 'development'
    const emailSubject = isDevelopment ? `[DEV TEST] ${subject}` : subject

    console.log(`📧 Sending approval email to: ${to}`)
    console.log(`📄 Subject: ${emailSubject}`)
    console.log(`🌍 Environment: ${environment}`)

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'World Founders <onboarding@wfounders.club>',
        to: [to],
        subject: emailSubject,
        html: getApprovalEmailTemplate(userName),
      }),
    })

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text()
      console.error(`❌ Resend API error: ${emailResponse.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ 
          error: `Failed to send email: ${emailResponse.status}`,
          details: errorText 
        }),
        { 
          status: emailResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await emailResponse.json()
    console.log('✅ Approval email sent successfully:', result)

    return new Response(
      JSON.stringify({ 
        message: 'Approval email sent successfully',
        emailId: result.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Approval email function error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Error details:', errorMessage)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})