import { ApiProperty } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator'

export class CreatePostDto {
  @ApiProperty({ example: 'Hello Prisma' })
  @IsString()
  @MinLength(1)
  title!: string

  @ApiProperty({ example: 'My first post body' })
  @IsString()
  @MinLength(1)
  content!: string

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean

  @ApiProperty({ description: 'Author user id (UUID)' })
  @IsString()
  @IsUUID()
  authorId!: string
}
