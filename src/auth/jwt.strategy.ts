import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { usuarios } from '../users/users.entity';
import { envs } from '../config/envs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: envs.TOKEN_SECRET_KEY, // Debe coincidir con la clave del JwtModule
    });
  }

  async validate(payload: { sub: number; username: string }): Promise<usuarios> {
    return this.usersService.findOne(payload.username);
  }
}
