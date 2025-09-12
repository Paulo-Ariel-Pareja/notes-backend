import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class PasswordService {
  constructor(private readonly configService: AppConfigService) {}

  private get saltRounds(): number {
    return this.configService.security.bcryptRounds;
  }

  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match, false otherwise
   */
  async comparePasswords(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
