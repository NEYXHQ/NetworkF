import config from '../config/env';

interface WelcomeEmailData {
  to: string;
  userName?: string;
}

interface ApprovalEmailData {
  to: string;
  userName?: string;
}

class EmailService {
  private readonly welcomeEmailUrl: string;
  private readonly approvalEmailUrl: string;

  constructor() {
    this.welcomeEmailUrl = `${config.supabase.url}/functions/v1/send-welcome-email`;
    this.approvalEmailUrl = `${config.supabase.url}/functions/v1/send-approval-email`;
  }

  /**
   * Call the welcome email Supabase function
   */
  private async callWelcomeEmailFunction(params: { to: string; subject: string; userName?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(this.welcomeEmailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send welcome email:', response.status, errorText);
        return { 
          success: false, 
          error: `Welcome email service responded with ${response.status}: ${errorText}` 
        };
      }

      await response.json(); // Consume response but don't need the result
      return { success: true };
    } catch (error) {
      console.error('❌ Error calling welcome email function:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Call the approval email Supabase function
   */
  private async callApprovalEmailFunction(params: { to: string; subject: string; userName?: string }): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(this.approvalEmailUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.supabase.anonKey}`,
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to send approval email:', response.status, errorText);
        return { 
          success: false, 
          error: `Approval email service responded with ${response.status}: ${errorText}` 
        };
      }

      await response.json(); // Consume response but don't need the result
      return { success: true };
    } catch (error) {
      console.error('❌ Error calling approval email function:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(emailData: WelcomeEmailData): Promise<{ success: boolean; error?: string }> {
    console.log('📧 Sending welcome email to:', emailData.to);
    return this.callWelcomeEmailFunction({
      to: emailData.to,
      subject: `Welcome to WFounders, ${emailData.userName || 'Founder'}!`,
      userName: emailData.userName,
    });
  }

  /**
   * Send test welcome email (for development/debugging)
   */
  async sendTestEmail(to: string): Promise<{ success: boolean; error?: string }> {
    console.log('🧪 Sending test welcome email to:', to);
    return this.callWelcomeEmailFunction({
      to: to,
      subject: 'Test Welcome Email from NetworkF2',
      userName: 'Test User',
    });
  }

  /**
   * Send approval email to approved user
   */
  async sendApprovalEmail(emailData: ApprovalEmailData): Promise<{ success: boolean; error?: string }> {
    console.log('🎉 Sending approval email to:', emailData.to);
    return this.callApprovalEmailFunction({
      to: emailData.to,
      subject: `Congratulations! Your WFounders Application is Approved`,
      userName: emailData.userName,
    });
  }
}

export const emailService = new EmailService();
export default emailService;