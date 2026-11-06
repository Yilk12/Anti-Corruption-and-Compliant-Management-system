import { IsEmail, IsOptional, MinLength, IsEnum, IsBoolean, IsString } from "class-validator"
import { ApiPropertyOptional } from "@nestjs/swagger"
import { UserType } from "../../common/enums/user-type.enum"
import { UserRole } from "../../common/enums/user-role.enum"
import { i18nValidationMessage } from 'nestjs-i18n'
import { IsArray, ValidateNested } from "class-validator"
import { Type } from 'class-transformer'
import { ModulePermissionDto, GenderEnum, DisabilityTypeEnum } from "./create-user.dto"

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "user@csc.gov.et" })
  @IsOptional()
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email?: string

  @ApiPropertyOptional({ example: "John" })
  @IsOptional()
  firstName?: string

  @ApiPropertyOptional({ example: "Michael" })
  @IsOptional()
  @IsString()
  middleName?: string

  @ApiPropertyOptional({ example: "Doe" })
  @IsOptional()
  lastName?: string

  @ApiPropertyOptional({ example: "ዮሐንስ" })
  @IsOptional()
  @IsString()
  firstNameAm?: string

  @ApiPropertyOptional({ example: "ሚካኤል" })
  @IsOptional()
  @IsString()
  middleNameAm?: string

  @ApiPropertyOptional({ example: "ዶ" })
  @IsOptional()
  @IsString()
  lastNameAm?: string

  @ApiPropertyOptional({ example: "password123" })
  @IsOptional()
  @MinLength(6, { message: i18nValidationMessage('validation.MIN_LENGTH', { length: 6 }) })
  password?: string

  @ApiPropertyOptional({ example: "+251911234567" })
  @IsOptional()
  phone?: string

  @ApiPropertyOptional({ example: "AB12345", description: "Employee ID (2 uppercase letters followed by numbers)" })
  @IsOptional()
  @IsString()
  employeeId?: string

  @ApiPropertyOptional({ example: "Software Engineer", description: "Employee position/job title" })
  @IsOptional()
  @IsString()
  position?: string

  @ApiPropertyOptional({ enum: GenderEnum })
  @IsOptional()
  @IsEnum(GenderEnum, { message: i18nValidationMessage('validation.ENUM') })
  gender?: GenderEnum

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.END_USER, isArray: true })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsEnum(UserRole, { each: true, message: i18nValidationMessage('validation.ENUM') })
  roles?: UserRole[]

  @ApiPropertyOptional({ enum: UserType, example: UserType.INTERNAL })
  @IsOptional()
  @IsEnum(UserType, { message: i18nValidationMessage('validation.ENUM') })
  userType?: UserType

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isDisabled?: boolean

  @ApiPropertyOptional({ enum: DisabilityTypeEnum })
  @IsOptional()
  @IsEnum(DisabilityTypeEnum, { message: i18nValidationMessage('validation.ENUM') })
  disabilityType?: DisabilityTypeEnum

  @ApiPropertyOptional({ example: "a3f6d9b2-1234-4cde-9876-abcdef012345", description: "Department ID (UUID). Use null to clear." })
  @IsOptional()
  departmentId?: string

  @ApiPropertyOptional({ example: "a3f6d9b2-1234-4cde-9876-abcdef012345", description: "Alternative: pass a raw value to be stored as departmentId." })
  @IsOptional()
  @IsString()
  departmentName?: string

  @ApiPropertyOptional({
    type: [ModulePermissionDto],
    required: false,
    description: 'Array of module permissions for the user'
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionDto)
  modulePermissions?: ModulePermissionDto[]

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isActive?: boolean
}
