// auth/dto/change-password.dto.ts
import { ApiProperty } from "@nestjs/swagger"
import { IsString, IsNotEmpty, MinLength } from "class-validator"

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string

  @ApiProperty({ description: 'New password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string
}