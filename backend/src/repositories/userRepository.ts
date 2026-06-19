import { Types } from 'mongoose';
import { User } from '../models/User';
import { IUser } from '../types';

export class UserRepository {
  async create(data: { name: string; email: string; password: string }): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) query.select('+password');
    return query.exec();
  }

  async findById(id: string | Types.ObjectId): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  async updateById(
    id: string | Types.ObjectId,
    data: Partial<Pick<IUser, 'name' | 'avatar'>>
  ): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }
}

export const userRepository = new UserRepository();
