import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { User } from "./user.entity";
import { Otp } from "./otp.entity";
import { GoogleStrategy } from "./google.strategy";
import { FacebookStrategy } from "./facebook.strategy";
import { AppleStrategy } from "./apple.strategy";
import { GithubStrategy } from "./github.strategy";
import * as dotenv from "dotenv";

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Otp]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "supersecret123",
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as any },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, FacebookStrategy, AppleStrategy, GithubStrategy],
})
export class AuthModule { }
