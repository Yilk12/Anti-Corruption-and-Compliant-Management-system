import { Module } from '@nestjs/common';
import { SecretCodeService } from './secret-code.service';
import { SecretCodeController } from './secret-code.controller';
import { SecretCodeGuard } from './guards/secret-code.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecretCodeController],
  providers: [SecretCodeService, SecretCodeGuard],
  exports: [SecretCodeService, SecretCodeGuard],
})
export class SecretCodeModule {}
