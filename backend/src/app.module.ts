import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { AnalyticsModule } from "./analytics/analytics.module"
import { CommonModule } from "./common/common.module"
import { PrismaModule } from "./prisma/prisma.module"
import { PasswordPolicyModule } from "./password-policy/password-policy.module"
import { I18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver, I18nJsonLoader } from 'nestjs-i18n'
import * as path from 'path'
import { PostsModule } from './posts/posts.module'
import { DepartmentsModule } from './departments/departments.module'
import { SubmissionsModule } from './submissions/submissions.module'
import { WorkflowModule } from './workflow/workflow.module'
import { UploadModule } from './upload/upload.module'
import { LoggerModule } from './common/logger/logger.module'
import { NotificationsModule } from './notifications/notifications.module'
import { SettingsModule } from './settings/settings.module'
import { EthicsModule } from './ethics/ethics.module'
import { MessagesModule } from "./messages/messages.module"
import { SecretCodeModule } from './secret-code/secret-code.module'
import { FeedbackModule } from './feedback/feedback.module'


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',      // prefer env file located in backend/.env
        '../.env',   // fallback to monorepo root .env
      ],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(__dirname, 'i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        new HeaderResolver(['x-lang', 'x-locale']),
        AcceptLanguageResolver,
      ],
    }),
    LoggerModule,
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    AnalyticsModule,
    PostsModule,
    DepartmentsModule,
    SubmissionsModule,
    WorkflowModule,
    UploadModule,
    PasswordPolicyModule,
    NotificationsModule,
    SettingsModule,
    EthicsModule,
    MessagesModule,
    SecretCodeModule,
    FeedbackModule,
  ],
})
export class AppModule {}
