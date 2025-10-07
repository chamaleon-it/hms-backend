import mongoose from 'mongoose';
import { UserRole } from 'src/users/schemas/user.schema';

export interface JWTUserInterface {
  id: mongoose.Types.ObjectId;
  email: string;
  role: UserRole;
}
