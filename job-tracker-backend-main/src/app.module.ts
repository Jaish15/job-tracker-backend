import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { JobsModule } from "./jobs/jobs.module";
import { User } from "./auth/user.entity";
import { Job } from "./jobs/job.entity";
import { Otp } from "./auth/otp.entity";
import * as dotenv from "dotenv";

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "jobtracker",
      entities: [User, Job, Otp],
      synchronize: process.env.DB_SYNC === "true", // Auto-create tables (set to false in production)
    }),
    AuthModule,
    JobsModule,
  ],
})
export class AppModule {}
