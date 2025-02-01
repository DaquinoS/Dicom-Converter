import { MiddlewareConsumer, Module } from '@nestjs/common';
import { DicomService } from './app/core/services/dicom.service';
import { EventsController } from './app/core/controllers/events.controller';
import { I18nMiddleware, I18nModule } from 'nestjs-i18n';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';
import { InitialConfigService } from './app/core/services/config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        fallbackLanguage: configService.get('DEFAULT_LANGUAGE'),
        loaderOptions: {
          path: path.join(__dirname, '/i18n/'),
          watch: true,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [EventsController],
  providers: [DicomService, InitialConfigService],
  exports: [InitialConfigService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(I18nMiddleware).forRoutes('*');
  }
}