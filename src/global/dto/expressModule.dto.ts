import 'express';
import { JwtPayloadAuth } from './jwtPayloadAuth.dto';

declare module 'express' {
  interface Request {
    user?: JwtPayloadAuth;
  }
}
