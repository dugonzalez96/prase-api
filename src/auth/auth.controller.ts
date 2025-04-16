import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDataDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
    async login(@Body() body: LoginDataDto) {
      const user = await this.authService.validateUser(body.username, body.password);
      if (!user) {
        return { message: 'Invalid credentials' };
      }
      return this.authService.login(user);
    }
}
