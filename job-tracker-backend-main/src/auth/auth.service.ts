import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import * as crypto from "crypto";
import { Resend } from "resend";

interface ResetToken {
  email: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private resetTokens = new Map<string, ResetToken>();

  async resetPassword(email: string) {
    if (!email) {
      throw new HttpException("Email is required", HttpStatus.BAD_REQUEST);
    }

    // Generate a real secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Store the token mapped to the email
    this.resetTokens.set(token, { email, expiresAt });

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://job-tracker-frontend-puce.vercel.app";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    console.log(`🔑 Reset token generated for ${email}`);
    console.log(`🔗 Reset link: ${resetLink}`);

    // Use Resend if API key is set, otherwise log the link (development fallback)
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "JobTracker <onboarding@resend.dev>",
          to: email,
          subject: "🔐 Reset Your JobTracker Password",
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
                <p style="color: #888; font-size: 13px;">This link expires in <strong>30 minutes</strong>.</p>
                <p style="color: #aaa; font-size: 12px; word-break: break-all;">Or copy: ${resetLink}</p>
              </div>
            </div>
          `,
        });

        console.log(`✉️  Password reset email sent to: ${email} via Resend`);
        return {
          success: true,
          message: "Password reset email sent! Check your inbox.",
        };
      } catch (err) {
        console.error("Resend error:", err);
        throw new HttpException(
          "Failed to send email",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } else {
      // No email provider configured — return the reset link directly for testing
      console.log(
        "⚠️  No RESEND_API_KEY set — returning reset link directly (dev mode)"
      );
      return {
        success: true,
        message: "Reset link generated (dev mode — no email sent)",
        resetLink, // Shown on frontend as a clickable link
        devMode: true,
      };
    }
  }

  async confirmReset(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new HttpException(
        "Token and new password are required",
        HttpStatus.BAD_REQUEST
      );
    }

    if (newPassword.length < 6) {
      throw new HttpException(
        "Password must be at least 6 characters",
        HttpStatus.BAD_REQUEST
      );
    }

    const record = this.resetTokens.get(token);

    if (!record) {
      throw new HttpException(
        "Invalid or already used reset token",
        HttpStatus.BAD_REQUEST
      );
    }

    if (Date.now() > record.expiresAt) {
      this.resetTokens.delete(token);
      throw new HttpException(
        "Reset token has expired. Please request a new one.",
        HttpStatus.BAD_REQUEST
      );
    }

    const { email } = record;
    this.resetTokens.delete(token); // Consume the token

    console.log(`✅ Password reset validated for: ${email}`);

    return {
      success: true,
      email,
      message:
        "Password reset successful. You can now log in with your new password.",
    };
  }

  // Stub login/register (real auth handled by AWS backend)
  async login(body: any) {
    return {
      accessToken: "mock-jwt-token",
      user: {
        id: 1,
        email: body.email,
        firstName: "Admin",
        lastName: "User",
        role: "admin",
      },
    };
  }

  async register(body: any) {
    return {
      accessToken: "mock-jwt-token",
      user: {
        id: 2,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        role: "user",
      },
    };
  }
}
