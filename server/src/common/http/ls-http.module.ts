import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LsHttpService } from './ls-http.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get('httpRequest.timeout'),
        maxRedirects: configService.get('httpRequest.maxRedirects'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [LsHttpService],
  exports: [LsHttpService],
})
export class LsHttpModule {}
