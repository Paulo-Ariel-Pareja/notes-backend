import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'title must not exceed 255 characters' })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, {
    message: 'description must not exceed 10,000 characters',
  })
  description: string;
}
