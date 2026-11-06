import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { SecretCodeService } from '../secret-code.service';

@Injectable()
export class SecretCodeGuard implements CanActivate {
  constructor(private secretCodeService: SecretCodeService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.user?.sub;

    if (!userId) {
      return false;
    }

    // Check if user has a valid verification session
    const hasValidSession = await this.secretCodeService.hasValidVerificationSession(userId);

    if (!hasValidSession) {
      throw new ForbiddenException('Secret code verification required. Please verify your secret code to access this resource.');
    }

    return true;
  }
}
