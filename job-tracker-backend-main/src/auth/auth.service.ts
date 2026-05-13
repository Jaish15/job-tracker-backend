import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import * as nodemailer from "nodemailer";

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter | null = null;
  private testAccount: any = null;

  async getTransporter() {
    if (!this.transporter) {
      // Create a fresh Ethereal test account each server start
      this.testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: this.testAccount.user,
          pass: this.testAccount.pass,
        },
      });
      console.log("Ethereal test account created:", this.testAccount.user);
    }
    return this.transporter;
  }

  async resetPassword(email: string) {
    if (!email) {
      throw new HttpException("Email is required", HttpStatus.BAD_REQUEST);
    }

    const resetLink = `http://localhost:5173/reset-password?token=mock-token-${Date.now()}`;

    try {
      const transport = await this.getTransporter();

      const info = await transport.sendMail({
        from: `"JobTracker Support" <support@jobtracker.com>`,
        to: email,
        subject: "🔐 Reset Your JobTracker Password",
        text: `You requested a password reset. Click here to reset: ${resetLink}\n\nThis link expires in 30 minutes.\nIf you did not request this, ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #111; font-size: 28px; margin: 0;">🎯 JobTracker</h1>
            </div>
            <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
              <h2 style="color: #111; margin-top: 0;">Reset your password</h2>
              <p style="color: #555; line-height: 1.6;">You requested a password reset for your JobTracker account associated with <strong>${email}</strong>.</p>
              <p style="color: #555; line-height: 1.6;">Click the button below to choose a new password:</p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetLink}" style="background: #6366f1; color: #fff; padding: 14px 32px; border-radius: 999px; text-decoration: none; font-weight: 700; font-size: 16px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #888; font-size: 13px; line-height: 1.6;">This link expires in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
            </div>
            <p style="text-align: center; color: #bbb; font-size: 12px; margin-top: 24px;">© 2026 JobTracker. All rights reserved.</p>
          </div>
        `,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log("✉️  Password reset email sent to:", email);
      console.log("👀 Preview URL:", previewUrl);

      return {
        success: true,
        message: "Password reset email sent",
        previewUrl,
      };
    } catch (err) {
      console.error("Email send error:", err);
      throw new HttpException("Failed to send email", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Stub login/register — keep the frontend working
  async login(body: any) {
    return {
      accessToken: "mock-jwt-token",
      user: { id: 1, email: body.email, firstName: "Admin", lastName: "User", role: "admin" },
    };
  }

  async register(body: any) {
    return {
      accessToken: "mock-jwt-token",
      user: { id: 2, email: body.email, firstName: body.firstName, lastName: body.lastName, role: "user" },
    };
  }
}
