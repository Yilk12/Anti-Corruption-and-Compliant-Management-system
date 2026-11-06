import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator'

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string

  @ApiPropertyOptional({ example: 'Updated content' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean
}
