import config from '../config/env';

interface WelcomeEmailData {
  to: string;
  userName?: string;
}

class EmailService {
  private readonly functionUrl: string;

  constructor() {
    this.functionUrl = `${config.supabase.url}/functions/v1/send-welcome-email`;
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(emailData: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('📧 Sending welcome email to:', emailData.to);

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify({
          to: emailData.to,
          subject: `Welcome to WFounders, ${emailData.userName || 'Founder'}!`,
          userName: emailData.userName,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send welcome email:', response.status, errorText);
        return { 
          success: false, 
          error: `Email service responded with ${response.status}: ${errorText}` 
        };
      }

      const result = await response.json();
      console.log('✅ Welcome email sent successfully:', result);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Send test email (for development/debugging)
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Sending test email to:', to);

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify({
          to,
          subject: 'Test Email from WFounders',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send test email:', response.status, errorText);
        return { 
          success: false, 
          error: `Email service responded with ${response.status}: ${errorText}` 
        };
      }

      const result = await response.json();
      console.log('✅ Test email sent successfully:', result);
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending test email:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}

export const emailService = new EmailService();
export default emailService;