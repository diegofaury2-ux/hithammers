import { UserProfile } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        profile: UserProfile;
        email: string | null;
        name: string;
      };
    }
  }
}
