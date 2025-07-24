import type { EmailRequest, EmailResponse, ApiResponse } from '../types/api';
import { apiClient } from './apiClient';

class EmailService {
  async sendEmail(emailData: EmailRequest): Promise<EmailResponse> {
    const response = await apiClient.post<ApiResponse<EmailResponse>>('/email/send', emailData);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to send email');
  }

  async sendWelcomeEmail(userEmail: string, userName: string): Promise<EmailResponse> {
    return this.sendEmail({
      to: userEmail,
      subject: 'Welcome to NetworkF2!',
      body: `
        <h1>Welcome ${userName}!</h1>
        <p>Thank you for joining NetworkF2. We're excited to have you on board.</p>
        <p>Get started by exploring our features and connecting with other professionals.</p>
      `,
      isHtml: true,
    });
  }

  async sendPasswordResetEmail(userEmail: string, resetToken: string): Promise<EmailResponse> {
    const resetUrl = `${window.location.origin}/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: userEmail,
      subject: 'Reset Your Password - NetworkF2',
      body: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
      isHtml: true,
    });
  }

  async sendContactFormEmail(formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<EmailResponse> {
    const adminEmail = 'admin@networkf2.com'; // This should come from config
    
    return this.sendEmail({
      to: adminEmail,
      subject: `Contact Form: ${formData.subject}`,
      body: `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${formData.name} (${formData.email})</p>
        <p><strong>Subject:</strong> ${formData.subject}</p>
        <p><strong>Message:</strong></p>
        <p>${formData.message.replace(/\n/g, '<br>')}</p>
      `,
      isHtml: true,
    });
  }
}

export const emailService = new EmailService(); 