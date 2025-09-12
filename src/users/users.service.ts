import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PasswordService } from '../common/services/password.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
  ) {}

  async create(
    email: string,
    clearPassword: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const password = await this.passwordService.hashPassword(clearPassword);

    const user = this.userRepository.create({
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    return this.userRepository.save(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['notes'],
    });

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<User | null> {
    if (!id) {
      return null;
    }

    return this.userRepository.findOne({
      where: { id },
      relations: ['notes'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async changePassword(id: string, newPassword: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');

    user.password = await this.passwordService.hashPassword(newPassword);
    return this.userRepository.save(user);
  }

  private async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }
}
