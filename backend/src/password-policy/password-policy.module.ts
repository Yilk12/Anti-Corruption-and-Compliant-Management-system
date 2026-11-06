import { Module } from "@nestjs/common";
import { PasswordPolicyController } from "./password-policy.controller";
import { PasswordPolicyService } from "./password-policy.service";
import { PrismaService } from "../prisma/prisma.service";

@Module({
  controllers: [PasswordPolicyController],
  providers: [PasswordPolicyService, PrismaService],
  exports: [PasswordPolicyService],
})
export class PasswordPolicyModule {}
