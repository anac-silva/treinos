import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { User } from '../../generated/prisma/client';

export function publicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, mustChangePassword: user.mustChangePassword,
    active: user.active, createdAt: user.createdAt, updatedAt: user.updatedAt, lastLoginAt: user.lastLoginAt };
}

@Injectable()
export class UsersService {
  constructor(private readonly database: PrismaService) {}
  findByEmail(email: string) { return this.database.user.findUnique({ where: { email } }); }
}
