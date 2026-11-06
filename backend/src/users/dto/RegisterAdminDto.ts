import { IsEmail, IsNotEmpty, MinLength, IsOptional } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { i18nValidationMessage } from "nestjs-i18n"

export class RegisterAdminDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail({}, { message: i18nValidationMessage("validation.IS_EMAIL") })
  @IsNotEmpty({ message: i18nValidationMessage("validation.REQUIRED") })
  email: string

  @ApiProperty({ example: "Yilkal" })
  @IsNotEmpty({ message: i18nValidationMessage("validation.REQUIRED") })
  firstName: string

  @ApiProperty({ example: "Father" })
  @IsNotEmpty({ message: i18nValidationMessage("validation.REQUIRED") })
  lastName: string


  @ApiProperty({ example: "+251911234567", required: false })
  @IsOptional()
  phone?: string
}
