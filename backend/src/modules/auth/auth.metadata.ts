import { SetMetadata } from '@nestjs/common';
export const PUBLIC = 'auth.public';
export const ALLOW_PASSWORD_CHANGE = 'auth.allowPasswordChange';
export const Public = () => SetMetadata(PUBLIC, true);
export const AllowPasswordChange = () => SetMetadata(ALLOW_PASSWORD_CHANGE, true);
