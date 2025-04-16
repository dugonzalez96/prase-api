import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';
import { MailerController } from './mailer.controller';

@Module({
    imports: [ConfigModule],
    providers: [MailerService],
    controllers: [MailerController],
})
export class MailerModule {}
