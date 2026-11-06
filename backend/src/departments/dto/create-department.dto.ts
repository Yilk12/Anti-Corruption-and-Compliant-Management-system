import { IsNotEmpty, IsOptional, IsBoolean } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { i18nValidationMessage } from 'nestjs-i18n'

export class CreateDepartmentDto {
  @ApiProperty({ example: "IT Department" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  name: string

  @ApiProperty({ example: "ቴክኖሎጂ ክፍል", required: false })
  @IsOptional()
  nameAm?: string

  @ApiProperty({ example: "Handles technology infrastructure", required: false })
  @IsOptional()
  description?: string

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isActive?: boolean
}
