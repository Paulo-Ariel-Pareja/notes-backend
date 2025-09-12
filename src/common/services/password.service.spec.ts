import { Test, TestingModule } from '@nestjs/testing';

import { PasswordService } from './password.service';
import { AppConfigService } from '../../config/config.service';

describe('PasswordService', () => {
  let service: PasswordService;
  let configService: AppConfigService;

  const mockAppConfigService = {
    security: { bcryptRounds: 10 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
        PasswordService,
      ],
    }).compile();

    configService = module.get<AppConfigService>(AppConfigService);
    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await service.hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await service.hashPassword(password);
      const hash2 = await service.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await service.hashPassword(password);
      const result = await service.comparePasswords(password, hashedPassword);

      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await service.hashPassword(password);
      const result = await service.comparePasswords(
        wrongPassword,
        hashedPassword,
      );

      expect(result).toBe(false);
    });
  });
});
