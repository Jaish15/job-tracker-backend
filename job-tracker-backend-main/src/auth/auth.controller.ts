import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("reset-password")
  async resetPassword(@Body("email") email: string) {
    return this.authService.resetPassword(email);
  }

  @Post("login")
  async login(@Body() body: any) {
    return this.authService.login(body);
  }

  @Post("register")
  async register(@Body() body: any) {
    return this.authService.register(body);
  }
}
