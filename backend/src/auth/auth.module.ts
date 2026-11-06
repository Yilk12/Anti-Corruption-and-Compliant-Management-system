import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { ConfigModule, ConfigService } from "@nestjs/config"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"
import { JwtStrategy } from "./strategies/jwt.strategy"
import { LocalStrategy } from "./strategies/local.strategy"
import { UsersModule } from "../users/users.module"
import { PasswordPolicyModule } from "../password-policy/password-policy.module"

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        // Provide a safe default in development to avoid runtime errors
        secret: configService.get<string>("JWT_SECRET") || "dev-insecure-secret-change-me",
        signOptions: {
          // Fallback to a sane default if JWT_EXPIRES_IN is not set
          expiresIn: configService.get<string>("JWT_EXPIRES_IN") || "1d",
        },
      }),
      inject: [ConfigService],
    }),
    PasswordPolicyModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
