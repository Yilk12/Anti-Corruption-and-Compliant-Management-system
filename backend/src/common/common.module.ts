import { Global, Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { PrismaModule } from "../prisma/prisma.module"
import { LocalizationService } from "./localization.service"
import { EmailService } from "./email.service"
import { NotificationService } from "./notification.service"
import { AuditService } from "./audit.service"

@Global()
@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [
    LocalizationService,
    EmailService,
    NotificationService,
    AuditService,
  ],
  exports: [
    LocalizationService,
    EmailService,
    NotificationService,
    AuditService,
  ],
})
export class CommonModule {}
