import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "../../common/enums/user-type.enum";
import { UserRole } from "../../common/enums/user-role.enum";
import { i18nValidationMessage } from 'nestjs-i18n';
import { Type } from 'class-transformer';

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum DisabilityTypeEnum {
  BLIND = 'BLIND',
  DEAF = 'DEAF',
  PHYSICAL_OR_MOVEMENT_DISORDER = 'PHYSICAL_OR_MOVEMENT_DISORDER',
  MENTAL_RETARDATION = 'MENTAL_RETARDATION',
  OVERLAPPING_FACES = 'OVERLAPPING_FACES',
  PSYCHOLOGICAL_AND_SOCIAL_DISORDER = 'PSYCHOLOGICAL_AND_SOCIAL_DISORDER',
}

export class ModulePermissionDto {
  @ApiProperty({ example: "tickets", description: 'Module name' })
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  moduleName: string;

  @ApiProperty({ 
    example: ["view", "create", "edit", "delete", "assign"],
    description: 'Array of permission actions'
  })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsString({ each: true, message: i18nValidationMessage('validation.IS_STRING') })
  permissions: string[];
}

export class CreateUserDto {
  @ApiProperty({ example: "user@csc.gov.et" })
  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  email: string;

  @ApiProperty({ example: "John" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  firstName: string;

  @ApiProperty({ example: "Michael", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  middleName?: string;

  @ApiProperty({ example: "Doe" })
  @IsNotEmpty({ message: i18nValidationMessage('validation.REQUIRED') })
  lastName: string;

  @ApiProperty({ example: "ዮሐንስ", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  firstNameAm?: string;

  @ApiProperty({ example: "ሚካኤል", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  middleNameAm?: string;

  @ApiProperty({ example: "ዶ", required: false })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  lastNameAm?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.END_USER, isArray: true })
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @IsEnum(UserRole, { each: true, message: i18nValidationMessage('validation.ENUM') })
  roles: UserRole[];

  @ApiProperty({ enum: UserType, example: UserType.INTERNAL })
  @IsEnum(UserType, { message: i18nValidationMessage('validation.ENUM') })
  userType: UserType;

  @ApiProperty({ enum: GenderEnum, required: false })
  @IsOptional()
  @IsEnum(GenderEnum, { message: i18nValidationMessage('validation.ENUM') })
  gender?: GenderEnum;

  @ApiProperty({ example: "+251911234567", required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "AB12345", required: false, description: "Employee ID (2 uppercase letters followed by numbers)" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  employeeId?: string;

  @ApiProperty({ example: "Software Engineer", required: false, description: "Employee position/job title" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  position?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isDisabled?: boolean;

  @ApiProperty({ enum: DisabilityTypeEnum, required: false })
  @IsOptional()
  @IsEnum(DisabilityTypeEnum, { message: i18nValidationMessage('validation.ENUM') })
  disabilityType?: DisabilityTypeEnum;

  @ApiProperty({ example: "Human Resources", required: false, description: "Name of the department" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  departmentName?: string; // <-- updated field

  @ApiProperty({ example: "6c3e8c5d-6f50-49b3-9e0b-6a0b0f2d9b9e", required: false, description: "Existing Department ID (preferred)" })
  @IsOptional()
  @IsString({ message: i18nValidationMessage('validation.IS_STRING') })
  departmentId?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean({ message: i18nValidationMessage('validation.IS_BOOLEAN') })
  isActive?: boolean;

  @ApiProperty({ 
    type: [ModulePermissionDto], 
    required: false,
    example: [
      { 
        moduleName: "tickets", 
        permissions: ["view", "create", "edit"]
      },
      { 
        moduleName: "knowledge_base", 
        permissions: ["view", "create"]
      }
    ],
    description: 'Array of module permissions for the user'
  })
  @IsOptional()
  @IsArray({ message: i18nValidationMessage('validation.IS_ARRAY') })
  @ValidateNested({ each: true })
  @Type(() => ModulePermissionDto)
  modulePermissions?: ModulePermissionDto[];
}
