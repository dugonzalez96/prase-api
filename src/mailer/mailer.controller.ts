import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { SendMailDto } from './dto/send-mail.dto';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK) // Retorna 200 explícitamente en caso de éxito
  async sendMail(@Body() sendMailDto: SendMailDto): Promise<{ message: string }> {
    const { to, subject, attachmentBase64, filename } = sendMailDto;

    // Llama al servicio para enviar el correo
    await this.mailerService.sendMail(to, subject, attachmentBase64, filename);

    // Retorna un mensaje de éxito
    return { message: 'Correo enviado exitosamente' };
  }
}
