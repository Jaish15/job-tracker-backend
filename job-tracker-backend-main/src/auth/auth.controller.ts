import { Controller, Post, Body, Get, Req, Res, UseGuards, ValidationPipe } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto, ResetPasswordDto } from "./dto/auth.dto";
import { AuthGuard } from "@nestjs/passport";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("send-otp")
  async sendOtp(@Body("email") email: string) {
    return this.authService.sendOtp(email);
  }

  @Post("reset-password")
  async resetPassword(@Body(ValidationPipe) body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email);
  }

  @Post("confirm-reset")
  async confirmReset(
    @Body("token") token: string,
    @Body("newPassword") newPassword: string
  ) {
    return this.authService.confirmReset(token, newPassword);
  }

  @Post("login")
  async login(@Body(ValidationPipe) body: LoginDto) {
    return this.authService.login(body);
  }

  @Post("register")
  async register(@Body(ValidationPipe) body: RegisterDto) {
    return this.authService.register(body);
  }

  @Get("google")
  @UseGuards(AuthGuard("google"))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get("google/callback")
  @UseGuards(AuthGuard("google"))
  googleAuthRedirect(@Req() req, @Res() res) {
    const { token } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || "https://job-tracker-frontend-puce.vercel.app";
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  }

  @Get("facebook")
  @UseGuards(AuthGuard("facebook"))
  async facebookAuth() {
    // Initiates the Facebook OAuth flow
  }

  @Get("facebook/callback")
  @UseGuards(AuthGuard("facebook"))
  facebookAuthRedirect(@Req() req, @Res() res) {
    const { token } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || "https://job-tracker-frontend-puce.vercel.app";
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  }

  @Get("apple")
  @UseGuards(AuthGuard("apple"))
  async appleAuth() {
    // Initiates the Apple OAuth flow
  }

  @Post("apple/callback")
  @UseGuards(AuthGuard("apple"))
  appleAuthRedirect(@Req() req, @Res() res) {
    const { token } = req.user;
    const frontendUrl = process.env.FRONTEND_URL || "https://job-tracker-frontend-puce.vercel.app";
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  }

  @Get("github")
  @UseGuards(AuthGuard("github"))
  async githubAuth() {
    // Initiates the GitHub OAuth flow
  }

  @Get("github/callback")
  @UseGuards(AuthGuard("github"))
  githubAuthRedirect(@Req() req, @Res() res) {
    const { token } = req.user; // extract token from service payload
    const frontendUrl = process.env.FRONTEND_URL || "https://job-tracker-frontend-puce.vercel.app";
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  }

  @Post("leetcode/sync")
  async leetcodeSync(@Body("username") username: string) {
    return {
      success: true,
      username: username || "anonymous",
      solvedTotal: 245,
      solvedEasy: 120,
      solvedMedium: 105,
      solvedHard: 20,
      totalQuestions: 3100,
      ranking: 142320,
      contestRating: 1650,
      activeStreak: 12,
      syncedAt: new Date().toISOString()
    };
  }
}
