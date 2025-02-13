import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

const configuration = require('../config/configuration');

@Module({
  imports: [
    NestConfigModule.forRoot({
      envFilePath: ['.env.local'],
      load: [configuration],
      // Don't require **every** module to depend on this
      // https://docs.nestjs.com/techniques/configuration#cache-environment-variables
      isGlobal: true,
      // We are **not** going to change environment variables live
      // so we can have Nest.js read the value once, and keep
      // on using it
      // https://docs.nestjs.com/techniques/configuration#cache-environment-variables
      cache: true,
    }),
  ],
})
export class ConfigModule {}
