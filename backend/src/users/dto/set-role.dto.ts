import { IsEnum } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { UserRole } from "../../common/enums/user-role.enum"

export class SetRoleDto {
  @ApiProperty({ enum: UserRole, description: "New role to assign to the user" })
  @IsEnum(UserRole)
  role!: UserRole
}
