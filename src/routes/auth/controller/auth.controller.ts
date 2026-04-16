import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { Request, Response } from 'express';
import { RedisService } from 'src/global/redis/service/redis.service';
import { Login } from 'src/global/decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private redis: RedisService,
  ) {}

  @Get('callback')
  @HttpCode(HttpStatus.OK)
  @Login()
  async getToken(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    return await this.authService.getToken(req, res, code, state);
  }

  @Get('login')
  @HttpCode(HttpStatus.OK)
  @Login()
  async login(@Req() req: Request, @Res() res: Response) {
    return this.authService.redirectToSso(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.redis.deleteJwtSession(req.cookies.session_id as string);
    res.clearCookie('session_id');
  }
}
