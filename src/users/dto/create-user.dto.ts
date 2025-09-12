import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'role must be either admin or user' })
  role?: UserRole = UserRole.USER;
}
