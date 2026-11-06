import { IsEmail, IsNotEmpty, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { i18nValidationMessage } from 'nestjs-i18n'

export class LoginDto {
  @ApiProperty({ example: "user@csc.gov.et" })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  email: string

  @ApiProperty({ example: "password123" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH', { length: 6 }) })
  password: string
}
