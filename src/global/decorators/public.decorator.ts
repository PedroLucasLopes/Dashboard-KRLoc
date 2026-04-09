import { SetMetadata } from '@nestjs/common';

export const Login = () => SetMetadata('isLogin', true);
