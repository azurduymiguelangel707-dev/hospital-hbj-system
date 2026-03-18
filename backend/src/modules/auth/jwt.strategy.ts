import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

const JWT_SECRET = process.env.JWT_SECRET || 'hospital_jwt_secret_2024_hbj';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    if (!payload) throw new UnauthorizedException();
    return {
      userId: payload.sub,
      email: payload.email || null,
      role: payload.role,
      doctorId: payload.doctorId || null,
      nombre: payload.nombre,
      apellido: payload.apellido || null,
      especialidad: payload.especialidad || null,
      patientId: payload.patientId || null,
      numeroHistorial: payload.numeroHistorial || null,
    };
  }
}