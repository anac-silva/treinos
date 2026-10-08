import { Request } from 'express';
import { Session, User } from '../../generated/prisma/client';
export interface AuthRequest extends Request {
  auth?: { user: User; session: Session };
  requestId?: string;
}
