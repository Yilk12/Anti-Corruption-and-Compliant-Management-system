import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "../src/app.module"
import { I18nValidationPipe, I18nValidationExceptionFilter, I18nService } from 'nestjs-i18n'
import { Request, Response } from 'express'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import * as express from 'express'
import { join } from 'path'
import { I18nExceptionFilter } from '../src/common/filters/i18n-exception.filter'

let app: any = null

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule)

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
      }) as unknown as ValidationPipe,
    )

    // Resolve I18nService from container
    const i18nService = app.get<I18nService<Record<string, unknown>>>(I18nService)

    // Global i18n exception filters
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

    // Serve static uploads
    app.use(
      '/uploads',
      express.static(join(process.cwd(), 'uploads')),
    )

    await app.init()
  }
  return app
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap()
  app.getHttpAdapter().getInstance()(req, res)
}
