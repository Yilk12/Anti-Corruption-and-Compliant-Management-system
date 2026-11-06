import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PasswordPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getPolicy() {
    const existing = await this.prisma.passwordPolicy.findFirst();
    if (existing) return existing;
    // Create a default policy if none exists
    return this.prisma.passwordPolicy.create({
      data: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireDigit: true,
        requireSpecialcharSymbol: true,
        expirationDays: 90,
      },
    });
  }

  async upsertPolicy(data: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireDigit?: boolean;
    requireSpecialcharSymbol?: boolean;
    expirationDays?: number;
  }) {
    const existing = await this.prisma.passwordPolicy.findFirst();
    if (!existing) {
      return this.prisma.passwordPolicy.create({
        data: {
          minLength: data.minLength ?? 12,
          requireUppercase: data.requireUppercase ?? true,
          requireLowercase: data.requireLowercase ?? true,
          requireDigit: data.requireDigit ?? true,
          requireSpecialcharSymbol: data.requireSpecialcharSymbol ?? true,
          expirationDays: data.expirationDays ?? 90,
        },
      });
    }
    return this.prisma.passwordPolicy.update({
      where: { id: existing.id },
      data: {
        minLength: data.minLength ?? existing.minLength,
        requireUppercase: data.requireUppercase ?? existing.requireUppercase,
        requireLowercase: data.requireLowercase ?? existing.requireLowercase,
        requireDigit: data.requireDigit ?? existing.requireDigit,
        requireSpecialcharSymbol:
          data.requireSpecialcharSymbol ?? existing.requireSpecialcharSymbol,
        expirationDays: data.expirationDays ?? existing.expirationDays,
      },
    });
  }
}
