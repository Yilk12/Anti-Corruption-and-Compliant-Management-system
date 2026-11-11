import { NestFactory } from "@nestjs/core"
import { AppModule } from "../src/app.module"
import { ExpressAdapter } from "@nestjs/platform-express"
import express from "express"

let app: any = null

async function bootstrap() {
  if (!app) {
    const server = express()
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(server)
    )
    
    nestApp.enableCors({
      origin: process.env.CORS_ORIGINS?.split(',') || '*',
      credentials: true,
    })
    
    await nestApp.init()
    app = server
  }
  return app
}

export default async function handler(req: any, res: any) {
  const app = await bootstrap()
  app(req, res)
}
