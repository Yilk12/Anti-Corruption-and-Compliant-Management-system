import { Body, Controller, Get, Patch, UseGuards, Injectable } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { PasswordPolicyService } from "./password-policy.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums/user-role.enum";

@ApiTags("Password Policy")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller("password-policy")
@Injectable() // Add this decorator
export class PasswordPolicyController {
  constructor(private readonly service: PasswordPolicyService) {}

  @ApiOperation({ summary: "Get password policy" })
  @Get()
  get() {
    return this.service.getPolicy();
  }

  @ApiOperation({ summary: "Update password policy" })
  @Patch()
  update(
    @Body()
    body: {
      minLength?: number;
      requireUppercase?: boolean;
      requireLowercase?: boolean;
      requireDigit?: boolean;
      requireSpecialcharSymbol?: boolean;
      expirationDays?: number;
    },
  ) {
    return this.service.upsertPolicy(body);
  }
}