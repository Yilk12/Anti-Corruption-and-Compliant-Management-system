import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"
import { I18nValidationPipe, I18nValidationExceptionFilter, I18nService } from 'nestjs-i18n'
import { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import * as express from 'express'
import { join } from 'path'
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Add root route for GET /
  app.getHttpAdapter().getInstance().get('/', (req: Request, res: Response) => {
    res.json({ message: 'ECSC Helpdesk API is running', status: 'ok' })
  })

  // Security & cookies
  app.use(helmet())
  app.use(cookieParser())

  // Enable CORS for frontend
  const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean)
  app.enableCors({
    origin: corsOrigins.length ? corsOrigins : (process.env.NODE_ENV === 'production' ? [] : [
      "http://localhost:3000",
    ]),
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
  })

  // API prefix
  app.setGlobalPrefix("api")

  // Global i18n-aware validation pipe
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // optionally set a fallback language for validation messages
      // fallbackOnErrors: true,
    }) as unknown as ValidationPipe,
  )

  // Resolve I18nService from container (no module selection)
  const i18nService = app.get<I18nService<Record<string, unknown>>>(I18nService)

  // Global i18n exception filters (validation + business errors)
  app.useGlobalFilters(new I18nValidationExceptionFilter(), new I18nExceptionFilter(i18nService))

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle("Ethiopian Civil Service Commission Helpdesk API")
    .setDescription("API for helpdesk and knowledge base system")
    .setVersion("1.0")
    .addBearerAuth()
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api/docs", app, document)

  // Serve static uploads (e.g. /uploads/articles/...) so attachments are directly readable in browser
  app.use(
    '/uploads',
    express.static(join(process.cwd(), 'uploads')),
  )

  const port = process.env.PORT || 4000
  await app.listen(port)

  console.log(`🚀 Application is running on: http://localhost:${port}`)
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap()
