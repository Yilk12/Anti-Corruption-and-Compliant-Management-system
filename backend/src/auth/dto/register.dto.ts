import { IsEmail, IsNotEmpty, MinLength, IsEnum, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { UserType } from "../../common/enums/user-type.enum"
import { UserRole } from "../../common/enums/user-role.enum"
import { i18nValidationMessage } from 'nestjs-i18n'

export class RegisterDto {
  @ApiProperty({ example: "user@csc.gov.et" })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  email: string

  @ApiProperty({ example: "John" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  firstName: string

  @ApiProperty({ example: "Doe" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  lastName: string

  @ApiProperty({ example: "password123" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH', { length: 6 }) })
  password: string

  @ApiProperty({ example: "+251911234567", required: false })
  @IsOptional()
  phone?: string

  @ApiProperty({ enum: UserRole, example: UserRole.END_USER, isArray: true })
  @IsEnum(UserRole, { message: i18nValidationMessage('validation.ENUM') })
  roles: UserRole[]

  @ApiProperty({ enum: UserType, example: UserType.INTERNAL })
  @IsEnum(UserType, { message: i18nValidationMessage('validation.ENUM') })
  userType: UserType

  @ApiProperty({ example: "Human Resources", required: false })
  @IsOptional()
  department?: string
}
