import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEnum, IsDateString, MinLength } from 'class-validator';

export enum ReportingChannel {
  PUBLIC_PORTAL = 'public_portal',
  EMPLOYEE = 'employee',
  TELEPHONE = 'telephone',
  REFERRAL = 'referral',
}

export enum ComplaintCategory {
  BRIBERY = 'Bribery',
  FRAUD = 'Fraud',
  FAVORITISM = 'Favoritism',
  ABUSE_OF_AUTHORITY = 'Abuse of Authority',
  CONFLICT_OF_INTEREST = 'Conflict of Interest',
  NEPOTISM = 'Nepotism',
  EMBEZZLEMENT = 'Embezzlement',
  OTHER = 'Other',
}

export enum ComplaintPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  URGENT = 'Urgent',
}

export class CreateComplaintDto {
  @ApiProperty({ 
    description: 'How the complaint was reported',
    enum: ReportingChannel 
  })
  @IsEnum(ReportingChannel)
  @IsOptional()
  reportingChannel?: ReportingChannel;

  @ApiProperty({ description: 'Whether the complaint is from internal (employee) or external source' })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @ApiProperty({ description: 'Verification secret for external tracking (optional, will be generated if not provided)' })
  @IsString()
  @IsOptional()
  verificationSecret?: string;

  @ApiProperty({ description: 'Whether the complaint is anonymous' })
  @IsBoolean()
  isAnonymous: boolean;

  @ApiProperty({ description: 'Complainant name (required if not anonymous)', required: false })
  @IsString()
  @IsOptional()
  complainantName?: string;

  @ApiProperty({ description: 'Complainant email', required: false })
  @IsString()
  @IsOptional()
  complainantEmail?: string;

  @ApiProperty({ description: 'Complainant department (auto-populated)', required: false })
  @IsString()
  @IsOptional()
  complainantDepartment?: string;

  @ApiProperty({ description: 'Complainant position (auto-populated)', required: false })
  @IsString()
  @IsOptional()
  complainantPosition?: string;

  @ApiProperty({ description: 'Complainant phone', required: false })
  @IsString()
  @IsOptional()
  complainantPhone?: string;

  @ApiProperty({ 
    description: 'Category of the complaint',
    enum: ComplaintCategory 
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ description: 'Institution or department', required: false })
  @IsString()
  @IsOptional()
  institution?: string;

  @ApiProperty({ description: 'Department', required: false })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiProperty({ description: 'Subject of complaint (person/office involved)', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Perpetrator position', required: false })
  @IsString()
  @IsOptional()
  perpetratorPosition?: string;

  @ApiProperty({ description: 'Date of incident', required: false })
  @IsDateString()
  @IsOptional()
  incidentDate?: string;

  @ApiProperty({ description: 'Location of incident', required: false })
  @IsString()
  @IsOptional()
  incidentLocation?: string;

  @ApiProperty({ description: 'Detailed description of the allegation' })
  @IsString()
  @MinLength(50)
  description: string;

  @ApiProperty({ description: 'Complaint text for administrative complaints', required: false })
  @IsString()
  @IsOptional()
  complaintText?: string;

  @ApiProperty({ 
    description: 'Priority level',
    enum: ComplaintPriority,
    default: ComplaintPriority.MEDIUM 
  })
  @IsEnum(ComplaintPriority)
  priority: ComplaintPriority;

  @ApiProperty({ description: 'Consent to declaration' })
  @IsBoolean()
  consentDeclaration: boolean;

  @ApiProperty({ description: 'Confirmation of information accuracy' })
  @IsBoolean()
  consentAccuracy: boolean;
}
