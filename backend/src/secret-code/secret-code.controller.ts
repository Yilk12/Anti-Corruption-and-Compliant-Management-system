import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SecretCodeService } from './secret-code.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Secret Code Security')
@ApiBearerAuth()
@Controller('secret-code')
export class SecretCodeController {
  constructor(private readonly secretCodeService: SecretCodeService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check secret code status for current user' })
  @ApiResponse({ status: 200, description: 'Secret code status' })
  async checkStatus(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    const status = await this.secretCodeService.checkStatus(userId);
    return { status };
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new secret code' })
  @ApiResponse({ status: 201, description: 'Secret code created successfully' })
  async createSecretCode(@Request() req, @Body() body: { code: string }) {
    const userId = req.user?.id || req.user?.sub;
    await this.secretCodeService.createSecretCode(userId, body.code);
    return { message: 'Secret code created successfully' };
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify secret code' })
  @ApiResponse({ status: 200, description: 'Secret code verified successfully' })
  async verifySecretCode(@Request() req, @Body() body: { code: string }) {
    const userId = req.user?.id || req.user?.sub;
    const isValid = await this.secretCodeService.verifySecretCode(userId, body.code);
    
    if (isValid) {
      await this.secretCodeService.markAsVerified(userId);
      return { message: 'Secret code verified successfully' };
    } else {
      throw new Error('ያስገቡት ሴክሬት ኮድ ትክክል አይደለም ደግመዉ ይሞክሩ');
    }
  }

  @Post('reset-my-secret-code')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Reset your own secret code (for testing)' })
  @ApiResponse({ status: 200, description: 'Secret code reset successfully' })
  async resetMySecretCode(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    // @ts-ignore
    await this.secretCodeService.prisma.secretCode.deleteMany({
      where: { userId }
    });
    return { message: 'Your secret code has been reset. You can now create a new one.' };
  }

  @Post('reset/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reset a user\'s secret code (Admin only)' })
  @ApiResponse({ status: 200, description: 'Secret code reset successfully' })
  async resetSecretCode(
    @Param('userId') userId: string,
    @Body() body: { reason: string },
    @Request() req
  ) {
    const adminId = req.user?.id || req.user?.sub;
    await this.secretCodeService.resetSecretCode(userId, body.reason, adminId);
    return { message: 'Secret code reset successfully' };
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with secret code status (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of users with secret code status' })
  async getAllUsersWithSecretCodeStatus() {
    return await this.secretCodeService.getAllUsersWithSecretCodeStatus();
  }
}
