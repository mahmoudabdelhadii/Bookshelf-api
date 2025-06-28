import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../utils/envConfig.js";

/**
 * Email service for sending authentication-related emails
 * Supports multiple email providers and templates
 */

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailVerificationData {
  email: string;
  firstName: string;
  verificationUrl: string;
  expiresIn: string;
}

export interface PasswordResetData {
  email: string;
  firstName: string;
  resetUrl: string;
  expiresIn: string;
}

export interface WelcomeEmailData {
  email: string;
  firstName: string;
  username: string;
  loginUrl: string;
}

export interface SecurityAlertData {
  email: string;
  firstName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  /**
   * Initialize email service with configuration
   */
  async initialize(): Promise<void> {
    try {
      if (!env.EMAIL_USER || !env.EMAIL_PASS) {
        console.warn("Email service not configured. EMAIL_USER and EMAIL_PASS are required.");
        return;
      }

      const transportConfig = {
        service: env.EMAIL_SERVICE,
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE,
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: env.isProduction,
        },
      };

      this.transporter = nodemailer.createTransport(transportConfig);

      
      await this.transporter.verify();
      this.isConfigured = true;
      console.log("Email service initialized successfully");
    } catch (err) {
      console.error("Failed to initialize email service:", err);
      this.isConfigured = false;
    }
  }

  /**
   * Send email with error handling and retry logic
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn("Email service not configured. Email not sent:", options.subject);
      return false;
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const mailOptions = {
          from: `${env.EMAIL_FROM_NAME} <${env.EMAIL_FROM}>`,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text || this.htmlToText(options.html),
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.to}:`, result.messageId);
        return true;
      } catch (err) {
        lastError = err as Error;
        console.error(`Email attempt ${attempt} failed:`, err);
        
        if (attempt < maxRetries) {
          
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    console.error(`Failed to send email after ${maxRetries} attempts:`, lastError);
    return false;
  }

  /**
   * Send email verification email
   */
  async sendEmailVerification(data: EmailVerificationData): Promise<boolean> {
    const html = this.getEmailVerificationTemplate(data);
    
    return this.sendEmail({
      to: data.email,
      subject: "Verify Your Email Address - Bookshelf API",
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(data: PasswordResetData): Promise<boolean> {
    const html = this.getPasswordResetTemplate(data);
    
    return this.sendEmail({
      to: data.email,
      subject: "Reset Your Password - Bookshelf API",
      html,
    });
  }

  /**
   * Send welcome email after successful registration
   */
  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = this.getWelcomeTemplate(data);
    
    return this.sendEmail({
      to: data.email,
      subject: "Welcome to Bookshelf API!",
      html,
    });
  }

  /**
   * Send security alert email
   */
  async sendSecurityAlert(data: SecurityAlertData): Promise<boolean> {
    const html = this.getSecurityAlertTemplate(data);
    
    return this.sendEmail({
      to: data.email,
      subject: `Security Alert: ${data.action} - Bookshelf API`,
      html,
    });
  }

  /**
   * Email verification template
   */
  private getEmailVerificationTemplate(data: EmailVerificationData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Bookshelf API</h1>
        <h2>Email Verification Required</h2>
    </div>
    
    <div class="content">
        <p>Hello ${data.firstName},</p>
        
        <p>Thank you for creating an account with Bookshelf API! To complete your registration and secure your account, please verify your email address.</p>
        
        <div style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">
            ${data.verificationUrl}
        </p>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This verification link will expire in ${data.expiresIn}. If you don't verify your email within this time, you'll need to request a new verification email.
        </div>
        
        <p>If you didn't create this account, please ignore this email or contact our support team.</p>
        
        <p>Best regards,<br>The Bookshelf API Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} Bookshelf API. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Password reset template
   */
  private getPasswordResetTemplate(data: PasswordResetData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .security-tip { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔐 Bookshelf API</h1>
        <h2>Password Reset Request</h2>
    </div>
    
    <div class="content">
        <p>Hello ${data.firstName},</p>
        
        <p>We received a request to reset your password for your Bookshelf API account. Click the button below to create a new password:</p>
        
        <div style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 3px;">
            ${data.resetUrl}
        </p>
        
        <div class="warning">
            <strong>⚠️ Important:</strong> This reset link will expire in ${data.expiresIn}. For security reasons, you'll need to request a new reset link if this one expires.
        </div>
        
        <div class="security-tip">
            <strong>🛡️ Security Tip:</strong> Choose a strong password with at least 8 characters, including uppercase letters, lowercase letters, numbers, and special characters.
        </div>
        
        <p><strong>If you didn't request this password reset:</strong></p>
        <ul>
            <li>Ignore this email - your password will remain unchanged</li>
            <li>Consider changing your password if you suspect unauthorized access</li>
            <li>Contact our support team if you have concerns</li>
        </ul>
        
        <p>Best regards,<br>The Bookshelf API Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} Bookshelf API. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Welcome email template
   */
  private getWelcomeTemplate(data: WelcomeEmailData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Bookshelf API</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .feature { background: white; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Welcome to Bookshelf API!</h1>
        <h2>Your account is ready</h2>
    </div>
    
    <div class="content">
        <p>Hello ${data.firstName},</p>
        
        <p>🎉 Congratulations! Your Bookshelf API account has been successfully created and verified. You're now ready to start managing your digital library.</p>
        
        <div class="feature">
            <h3>📖 Your Account Details</h3>
            <p><strong>Username:</strong> ${data.username}<br>
            <strong>Email:</strong> ${data.email}</p>
        </div>
        
        <div class="feature">
            <h3>🚀 What you can do now:</h3>
            <ul>
                <li>Create and manage your personal library</li>
                <li>Add books with detailed information</li>
                <li>Search and organize your collection</li>
                <li>Access our comprehensive API</li>
            </ul>
        </div>
        
        <div style="text-align: center;">
            <a href="${data.loginUrl}" class="button">Login to Your Account</a>
        </div>
        
        <div class="feature">
            <h3>🛡️ Security Features</h3>
            <ul>
                <li>Your account is protected with enterprise-grade security</li>
                <li>We monitor all login attempts and unusual activity</li>
                <li>You can enable two-factor authentication for extra security</li>
            </ul>
        </div>
        
        <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
        
        <p>Happy reading!<br>The Bookshelf API Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} Bookshelf API. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Security alert template
   */
  private getSecurityAlertTemplate(data: SecurityAlertData): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Alert</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 5px 5px; }
        .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
        .details { background: white; border: 1px solid #ddd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 Security Alert</h1>
        <h2>Account Activity Detected</h2>
    </div>
    
    <div class="content">
        <p>Hello ${data.firstName},</p>
        
        <div class="alert">
            <strong>⚠️ We detected ${data.action} on your Bookshelf API account.</strong>
        </div>
        
        <div class="details">
            <h3>📋 Activity Details:</h3>
            <p><strong>Action:</strong> ${data.action}<br>
            <strong>Time:</strong> ${data.timestamp}<br>
            <strong>IP Address:</strong> ${data.ipAddress}<br>
            <strong>Device:</strong> ${data.userAgent}${data.location ? `<br><strong>Location:</strong> ${data.location}` : ""}</p>
        </div>
        
        <p><strong>If this was you:</strong> No action is required. Your account remains secure.</p>
        
        <p><strong>If this wasn't you:</strong></p>
        <ul>
            <li>Change your password immediately</li>
            <li>Review your account for any unauthorized changes</li>
            <li>Enable two-factor authentication</li>
            <li>Contact our support team</li>
        </ul>
        
        <div class="alert">
            <strong>🛡️ Security Tip:</strong> We recommend enabling two-factor authentication and using a strong, unique password for your account.
        </div>
        
        <p>We take your account security seriously. If you have any concerns, please contact our support team immediately.</p>
        
        <p>Best regards,<br>The Bookshelf API Security Team</p>
    </div>
    
    <div class="footer">
        <p>This is an automated security alert. Please do not reply to this email.</p>
        <p>© ${new Date().getFullYear()} Bookshelf API. All rights reserved.</p>
    </div>
</body>
</html>`;
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]+>/g, "") 
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (err) {
      console.error("Email connection test failed:", err);
      return false;
    }
  }

  /**
   * Send test email
   */
  async sendTestEmail(to: string): Promise<boolean> {
    return this.sendEmail({
      to,
      subject: "Bookshelf API - Email Service Test",
      html: `
        <h2>📧 Email Service Test</h2>
        <p>This is a test email from Bookshelf API.</p>
        <p>If you received this email, the email service is working correctly!</p>
        <p><small>Sent at: ${new Date().toISOString()}</small></p>
      `,
    });
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    transporter: boolean;
    provider: string;
  } {
    return {
      configured: this.isConfigured,
      transporter: !!this.transporter,
      provider: env.EMAIL_SERVICE,
    };
  }
}


export const emailService = new EmailService();


if (env.EMAIL_USER && env.EMAIL_PASS) {
  emailService.initialize().catch(console.error);
}

export default emailService;
