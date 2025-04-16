import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.mailersend.net',
      port: 587,
      auth: {
        user: 'MS_AIvTVI@trial-3z0vklo12w1g7qrx.mlsender.net', // Usuario fijo para SendGrid
        pass: 'GUuOdkUpBhHZnmoM', // Tu API Key de SendGrid
      },
    });
  }

  // Template HTML para correos
  private htmlTemplate = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cotización PRASE</title>
<style>
 body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
        color: #333;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #003366; /* Azul rey */
        padding-bottom: 10px;
      }
      .header img {
        max-width: 120px;
      }
      .header h1 {
        font-size: 24px;
        color: #007bff; /* Azul para el encabezado principal */
      }
      .content {
        margin: 20px 0;
        line-height: 1.6;
        color: #007bff; /* Azul para el texto principal */
      }
      .content h2 {
        color: #333;
      }
      .content p {
        margin: 10px 0;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        font-size: 12px;
        color: #777;
      }
      .footer a {
        color: #003366; /* Azul rey */
        text-decoration: none;
      }
      .footer a:hover {
        text-decoration: underline;
      }
    </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="https://files.sigsalud.mx/images/prase-logo.png" alt="PRASE Logo">
          <h1>¡Gracias por cotizar con PRASE!</h1>
        </div>
        <div class="content">
          <h2>Detalles de tu cotización</h2>
          <p>A continuación, encontrarás un archivo PDF con los datos completos de tu cotización:</p>
          <p>Si tienes alguna duda o necesitas realizar cambios, no dudes en contactarnos.</p>
        </div>
        <div class="footer">
          <p>&copy; 2024 PRASE. Todos los derechos reservados.</p>
          <p><a href="https://www.prase.mx">www.prase.mx</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

  /**
   * Método para enviar correo
   * @param to Destinatarios del correo
   * @param subject Asunto del correo
   * @param attachmentBase64 Archivo en base64
   * @param filename Nombre del archivo adjunto
   */
  async sendMail(
    to: string,
    subject: string,
    attachmentBase64?: string,
    filename?: string,
  ): Promise<void> {
    const mailOptions: any = {
      from: 'MS_AIvTVI@trial-3z0vklo12w1g7qrx.mlsender.net', // Remitente verificado en SendGrid
      to,
      subject,
      html: this.htmlTemplate, // Usa el template HTML
    };

    if (attachmentBase64 && filename) {
      mailOptions.attachments = [
        {
          filename,
          content: Buffer.from(attachmentBase64, 'base64'),
        },
      ];
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Correo enviado con éxito:', info.messageId);
    } catch (error) {
      console.error('Error al enviar correo:', error);
      throw new HttpException(
        'Error al enviar correo',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
