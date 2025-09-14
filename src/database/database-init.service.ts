import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { PasswordService } from '../common/services/password.service';
import { AppConfigService } from '../config/config.service';

@Injectable()
export class DatabaseInitService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly passwordService: PasswordService,
    private readonly configService: AppConfigService,
  ) {}

  async onModuleInit() {
    await this.createDefaultAdminUser();
  }

  private async createDefaultAdminUser() {
    const adminEmail = this.configService.app.saUser;
    const adminPassword = this.configService.app.saPassword;

    const existingAdmin = await this.userRepository.findOne({
      where: { role: UserRole.ADMIN },
    });

    if (!existingAdmin) {
      const hashedPassword =
        await this.passwordService.hashPassword(adminPassword);

      const adminUser = this.userRepository.create({
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN,
      });

      await this.userRepository.save(adminUser);
    }
  }
}
