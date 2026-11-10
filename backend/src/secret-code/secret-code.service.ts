import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SecretCodeService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 15;

  constructor(private prisma: PrismaService) {}

  /**
   * Check the secret code status for a user
   * Returns: 'NOT_CREATED', 'VERIFICATION_REQUIRED', 'RESET_REQUIRED', or 'VERIFIED'
   */
  async checkStatus(userId: string): Promise<string> {
    // @ts-ignore - Prisma client needs regeneration
    const secretCode = await this.prisma.secretCode.findUnique({
      where: { userId },
    });

    if (!secretCode) {
      return 'NOT_CREATED';
    }

    if (secretCode.resetRequired) {
      return 'RESET_REQUIRED';
    }

    if (secretCode.lockedUntil && secretCode.lockedUntil > new Date()) {
      throw new ForbiddenException(
        `Secret code verification is locked until ${secretCode.lockedUntil.toLocaleString()}`
      );
    }

    // Always return VERIFICATION_REQUIRED - secret code must be entered every time
    return 'VERIFICATION_REQUIRED';
  }

  /**
   * Create a new secret code for a user
   */
  async createSecretCode(userId: string, code: string): Promise<void> {
    // Check if secret code already exists
    // @ts-ignore - Prisma client needs regeneration
    const existing = await this.prisma.secretCode.findUnique({
      where: { userId },
    });

    if (existing && !existing.resetRequired) {
      throw new BadRequestException('Secret code already exists. Use reset to change it.');
    }

    // Hash the secret code
    const codeHash = await bcrypt.hash(code, 10);

    // Create or update the secret code
    // @ts-ignore - Prisma client needs regeneration
    await this.prisma.secretCode.upsert({
      where: { userId },
      create: {
        userId,
        codeHash,
        resetRequired: false,
        failedAttempts: 0,
        lockedUntil: null,
      },
      update: {
        codeHash,
        resetRequired: false,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });
  }

  /**
   * Verify a user's secret code
   */
  async verifySecretCode(userId: string, code: string): Promise<boolean> {
    // @ts-ignore - Prisma client needs regeneration
    const secretCode = await this.prisma.secretCode.findUnique({
      where: { userId },
    });

    if (!secretCode) {
      throw new NotFoundException('No secret code found for this user');
    }

    // Check if locked
    if (secretCode.lockedUntil && secretCode.lockedUntil > new Date()) {
      throw new ForbiddenException(
        `Secret code verification is locked until ${secretCode.lockedUntil.toLocaleString()}`
      );
    }

    // Verify the code
    const isValid = await bcrypt.compare(code, secretCode.codeHash);

    if (isValid) {
      // Reset failed attempts on successful verification
      // @ts-ignore - Prisma client needs regeneration
      await this.prisma.secretCode.update({
        where: { userId },
        data: {
          failedAttempts: 0,
          lockedUntil: null,
        },
      });
      return true;
    } else {
      // Increment failed attempts
      const newFailedAttempts = secretCode.failedAttempts + 1;
      const updateData: any = {
        failedAttempts: newFailedAttempts,
      };

      // Lock after max failed attempts
      if (newFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000
        );
      }

      // @ts-ignore - Prisma client needs regeneration
      await this.prisma.secretCode.update({
        where: { userId },
        data: updateData,
      });

      return false;
    }
  }

  /**
   * Reset a user's secret code (admin function)
   */
  async resetSecretCode(userId: string, reason: string, adminId: string): Promise<void> {
    // @ts-ignore - Prisma client needs regeneration
    const secretCode = await this.prisma.secretCode.findUnique({
      where: { userId },
    });

    if (!secretCode) {
      throw new NotFoundException('No secret code found for this user');
    }

    // Mark as reset required
    // @ts-ignore - Prisma client needs regeneration
    await this.prisma.secretCode.update({
      where: { userId },
      data: {
        resetRequired: true,
        failedAttempts: 0,
        lockedUntil: null,
      },
    });

    // Log the reset action (you can add audit logging here)
    console.log(`Secret code reset for user ${userId} by admin ${adminId}. Reason: ${reason}`);
  }

  /**
   * Get all users with their secret code status (for admin)
   */
  async getAllUsersWithSecretCodeStatus(): Promise<any[]> {
    // @ts-ignore - Prisma client needs regeneration
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        // @ts-ignore - Prisma client needs regeneration
        department: {
          select: {
            name: true,
          },
        },
        roles: true,
        // @ts-ignore - Prisma client needs regeneration
        secretCode: {
          select: {
            resetRequired: true,
            failedAttempts: true,
            lockedUntil: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return users.map(user => ({
      id: user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      // @ts-ignore - Prisma client needs regeneration
      department: user.department?.name || null,
      roles: user.roles,
      // @ts-ignore - Prisma client needs regeneration
      secretCodeStatus: user.secretCode ? 'ACTIVE' : 'NOT_CREATED',
      // @ts-ignore - Prisma client needs regeneration
      resetRequired: user.secretCode?.resetRequired || false,
      // @ts-ignore - Prisma client needs regeneration
      failedAttempts: user.secretCode?.failedAttempts || 0,
      // @ts-ignore - Prisma client needs regeneration
      lockedUntil: user.secretCode?.lockedUntil || null,
      // @ts-ignore - Prisma client needs regeneration
      lastResetDate: user.secretCode?.updatedAt || null,
    }));
  }

  /**
   * Check if a user has a valid verification session
   * This would typically use Redis or session storage
   * For now, we'll implement a simple version using the database
   */
  async hasValidVerificationSession(userId: string): Promise<boolean> {
    // This is a simplified version - in production, use Redis or session storage
    // @ts-ignore - Prisma client needs regeneration
    const secretCode = await this.prisma.secretCode.findUnique({
      where: { userId },
    });

    if (!secretCode) {
      return false;
    }

    // Check if verified recently (within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return secretCode.updatedAt > oneHourAgo && !secretCode.resetRequired;
  }

  /**
   * Mark user as verified (no-op since we don't use sessions)
   * Kept for backward compatibility
   */
  async markAsVerified(userId: string): Promise<void> {
    // No-op - verification sessions are not used
    // Secret code must be entered every time
  }
}
