import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { Resend } from "resend";
import { User } from "./user.entity";
import { Otp } from "./otp.entity";

interface ResetToken {
  email: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private resetTokens = new Map<string, ResetToken>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService
  ) {}

  async sendOtp(email: string) {
    if (!email) {
      throw new HttpException("Email is required", HttpStatus.BAD_REQUEST);
    }
    if (!email.toLowerCase().endsWith("@gmail.com")) {
      throw new HttpException("Only legitimate Gmail addresses (@gmail.com) are allowed", HttpStatus.BAD_REQUEST);
    }

    // Verify user doesn't already exist
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new HttpException("Email already registered", HttpStatus.CONFLICT);
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save/update OTP in database
    let otpRecord = await this.otpRepository.findOne({ where: { email } });
    if (otpRecord) {
      otpRecord.code = code;
      otpRecord.expiresAt = expiresAt;
    } else {
      otpRecord = this.otpRepository.create({ email, code, expiresAt });
    }
    await this.otpRepository.save(otpRecord);

    console.log(`✉️ OTP generated for ${email}: ${code}`);

    const resendApiKey = "re_gaiZfaRh_NapXBXKrtHbXXBFmuWCLVJB6";
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "JobTracker <onboarding@resend.dev>",
          to: email,
          subject: "🎯 Verify Your JobTracker Email",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #111; font-size: 28px; margin: 0;">🎯 JobTracker</h1>
              </div>
              <div style="background: #fff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
                <h2 style="color: #111; margin-top: 0; text-align: center;">Verify your email address</h2>
                <p style="color: #555; line-height: 1.6; text-align: center;">Use the verification code below to complete your registration:</p>
                <div style="text-align: center; margin: 32px 0;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; background: #f3f4f6; padding: 12px 24px; border-radius: 8px;">${code}</span>
                </div>
                <p style="color: #888; font-size: 13px; text-align: center;">This code will expire in <strong>10 minutes</strong>.</p>
              </div>
            </div>
          `,
        });
        console.log(`✉️ Email verification code sent successfully to ${email}`);
      } catch (err) {
        console.error("Resend OTP error:", err);
        // Fallback: don't block registration flow in local testing if Resend has issues,
        // but log and return a helpful message so development/testing is smooth.
        return {
          success: true,
          message: "Verification code generated. (Dev Mode: Check backend console logs)",
          devMode: true
        };
      }
    }

    return { success: true, message: "Verification code sent to your email." };
  }

  async resetPassword(email: string) {
    if (!email) {
      throw new HttpException("Email is required", HttpStatus.BAD_REQUEST);
    }

    // Verify user exists in the database
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // Return a success message anyway to prevent email enumeration attacks
      return { success: true, message: "If that email exists, a reset link was sent." };
    }

    // Generate a real secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

    // Store the token and expiry directly in the user DB record
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(expiresAt);
    await this.userRepository.save(user);

    const frontendUrl = process.env.FRONTEND_URL || "https://job-tracker-frontend-puce.vercel.app";
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    console.log(`🔑 Reset token generated for ${email}`);
    console.log(`🔗 Reset link: ${resetLink}`);

    // HARDCODED API KEY AS REQUESTED
    const resendApiKey = "re_gaiZfaRh_NapXBXKrtHbXXBFmuWCLVJB6";

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
        return { success: true, message: "Password reset email sent! Check your inbox." };
      } catch (err) {
        console.error("Resend error:", err);
        throw new HttpException("Failed to send email", HttpStatus.INTERNAL_SERVER_ERROR);
      }
    } else {
      console.log("⚠️ No RESEND_API_KEY set — returning reset link directly (dev mode)");
      return {
        success: true,
        message: "Reset link generated (dev mode — no email sent)",
        resetLink,
        devMode: true,
      };
    }
  }

  async confirmReset(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new HttpException("Token and new password are required", HttpStatus.BAD_REQUEST);
    }
    if (newPassword.length < 6) {
      throw new HttpException("Password must be at least 6 characters", HttpStatus.BAD_REQUEST);
    }

    // Find user by reset token
    const user = await this.userRepository.findOne({ where: { resetPasswordToken: token } });
    if (!user || !user.resetPasswordExpires) {
      throw new HttpException("Invalid or already used reset token", HttpStatus.BAD_REQUEST);
    }
    if (Date.now() > user.resetPasswordExpires.getTime()) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await this.userRepository.save(user);
      throw new HttpException("Reset token has expired. Please request a new one.", HttpStatus.BAD_REQUEST);
    }

    const { email } = user;

    // Hash the new password and save it directly!
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    console.log(`✅ Password reset validated and updated in DB for: ${email}`);

    return {
      success: true,
      email,
      message: "Password reset successful. You can now log in with your new password.",
    };
  }

  async validateOAuthLogin(profile: any, provider: string) {
    const { email, firstName, lastName } = profile;
    
    // Find user by email
    let user = await this.userRepository.findOne({ where: { email } });
    
    // If no user exists, create one without a password
    if (!user) {
      user = this.userRepository.create({
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        passwordHash: '', // OAuth users don't need a password initially
      });
      user = await this.userRepository.save(user);
    }
    
    // Return JWT token just like regular login
    const payload = { 
      email: user.email, 
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      token: this.jwtService.sign(payload),
    };
  }

  async login(body: any) {
    const { email, password } = body;
    if (!email || !password) {
      throw new HttpException("Email and password are required", HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new HttpException("Invalid credentials", HttpStatus.UNAUTHORIZED);
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async register(body: any) {
    const { email, password, firstName, lastName } = body;
    if (!email || !password) {
      throw new HttpException("Email and password are required", HttpStatus.BAD_REQUEST);
    }

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new HttpException("User with that email already exists", HttpStatus.CONFLICT);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'user'
    });

    const savedUser = await this.userRepository.save(newUser);

    const payload = { sub: savedUser.id, email: savedUser.email, role: savedUser.role };
    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
      },
    };
  }
}
