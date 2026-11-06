import { IsString, IsOptional, IsBoolean, IsDateString, IsUUID } from 'class-validator';

export class CreateThirdPartySexualAssaultDto {
  @IsUUID()
  misconductId: string;

  @IsString()
  typeOfMisconduct: string;

  @IsDateString()
  dateTime: string;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  descriptionOfWhatWasObserved?: string | null;

  @IsOptional()
  @IsUUID()
  victimUserId?: string | null;   // <-- matches frontend payload
}
