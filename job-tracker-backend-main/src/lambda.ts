import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';
import { ValidationPipe } from '@nestjs/common';

let cachedServer: Handler;

async function bootstrap() {
  if (!cachedServer) {
    const app = await NestFactory.create(AppModule);
    
    // Enable CORS for frontend
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type,Authorization',
      credentials: false,
    });
    
    // Global prefix required for Lambda API Gateway mapping
    app.setGlobalPrefix('api');
    
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    await app.init();
    
    const expressApp = app.getHttpAdapter().getInstance();
    cachedServer = serverlessExpress({ app: expressApp });
  }
  return cachedServer;
}

export const lambdaHandler: Handler = async (event: any, context: Context, callback: Callback) => {
  const server = await bootstrap();
  return server(event, context, callback);
};
