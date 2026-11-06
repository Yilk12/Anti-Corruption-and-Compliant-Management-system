import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SubmissionsService, CreateSubmissionInput, CreateWomenadnSocilaInclusionInput, CreateThirdPartySexualAssaultInput } from './submissions.service';
import { CreateThirdPartySexualAssaultDto } from './dto/CreateThirdPartySexualAssaultDto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { SubmissionType } from '../common/enums/submission-type.enum';
import { IsBoolean, IsEnum, IsOptional, IsString, IsDateString, MaxLength } from 'class-validator';

class CreateSubmissionDto {
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() recipientUserId?: string;
  @IsOptional() @IsBoolean() anonymous?: boolean;

  @IsEnum(SubmissionType) type!: SubmissionType;
  @IsString() @MaxLength(5000) message!: string;
}

class CreateWomenadnSocilaInclusionDto {
  @IsString() typeOfMisconduct!: string;
  @IsDateString() dateTime!: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() detailDescriptionOfIncident?: string;
  @IsBoolean() reportedBefore!: boolean;
  @IsBoolean() medicalHelpNeeded!: boolean;
  @IsOptional() @IsString() fileUrl?: string;
  @IsOptional() @IsString() victimId?: string;
  @IsOptional() @IsString() departmentId?: string;
  @IsOptional() @IsString() userId?: string;
}

@ApiTags('Submissions')
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly service: SubmissionsService) {}

  @ApiOperation({ summary: 'Create a complaint/suggestion (anonymous or authenticated)' })
  @Post()
  async create(@Request() req, @Body() dto: CreateSubmissionDto) {
    const maybeUserId = req?.user?.id || req?.user?.userId || null;
    const input: CreateSubmissionInput = {
      userId: dto.anonymous ? null : maybeUserId,
      recipientUserId: dto.recipientUserId || null,
      departmentId: dto.departmentId || null,
      anonymous: Boolean(dto.anonymous),
      type: dto.type,
      message: dto.message,
    };
    return this.service.create(input);
  }

  @ApiOperation({ summary: 'List submissions (Ethics & Anti-Corruption only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Ethics_Anti_Corruption, UserRole.Commissioner)
  @Get()
  async list(
    @Query('type') type?: SubmissionType,
  ) {
    return this.service.list({ type });
  }

  @ApiOperation({ summary: 'List submissions I created (non-anonymous)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine/created')
  async listMineCreated(
    @Request() req,
    @Query('type') type?: SubmissionType,
  ) {
    const me = req?.user?.id || req?.user?.userId;
    return this.service.listCreatedBy(String(me), { type });
  }

  @ApiOperation({ summary: 'List submissions where I am the recipient' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine/received')
  async listMineReceived(
    @Request() req,
    @Query('type') type?: SubmissionType,
  ) {
    const me = req?.user?.id || req?.user?.userId;
    return this.service.listForRecipient(String(me), { type });
  }

  @ApiOperation({ summary: 'List submissions for my department with no recipient (Department Head view)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('mine/department-unassigned')
  async listMyDepartmentUnassigned(
    @Request() req,
    @Query('type') type?: SubmissionType,
  ) {
    const me = req?.user?.id || req?.user?.userId;
    return this.service.listForMyDepartmentUnassigned(String(me), { type });
  }

  @ApiOperation({ summary: 'List all active departments (for submissions context)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('departments')
  async listDepartments() {
    return this.service.listDepartments();
  }

  @ApiOperation({ summary: 'List users in my department (based on req.user.departmentId)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-department/users')
  async listUsersInMyDepartment(@Request() req) {
    const me = req?.user?.id || req?.user?.userId;
    return this.service.listUsersInMyDepartment(String(me));
  }

  @ApiOperation({ summary: 'Create Women and Social Inclusion record' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('women-social-inclusion')
  async createWomenadnSocilaInclusion(@Request() req, @Body() dto: CreateWomenadnSocilaInclusionDto) {
    const maybeUserId = req?.user?.id || req?.user?.userId || null;

    const input: CreateWomenadnSocilaInclusionInput = {
      typeOfMisconduct: dto.typeOfMisconduct,
      dateTime: new Date(dto.dateTime),
      location: dto.location ?? null,
      detailDescriptionOfIncident: dto.detailDescriptionOfIncident ?? null,
      reportedBefore: dto.reportedBefore,
      medicalHelpNeeded: dto.medicalHelpNeeded,
      fileUrl: dto.fileUrl ?? null,
      // If a specific victim is provided (identified flow), honor it; otherwise, link to the current user
      victimId: dto.victimId ?? maybeUserId,
      departmentId: dto.departmentId ?? null,
      // userId here represents the offender/perpetrator when provided from the UI
      userId: dto.userId ?? null,
    };

    return this.service.createWomenadnSocilaInclusion(input);
  }

  @ApiOperation({ summary: 'Get all Women and Social Inclusion records (Department Head and Women Social Inclusion roles)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Department_Head, UserRole.Women_Social_Inclusion)
  @Get('women-social-inclusion')
  async getWomenadnSocilaInclusion() {
    return this.service.listWomenadnSocilaInclusion();
  }

  @ApiOperation({ summary: 'Get history of Women and Social Inclusion records for the current user (non-identifying fields only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('women-social-inclusion/anonymous-history')
  async getWomenadnSocilaInclusionAnonymousHistory(@Request() req) {
    const me = req?.user?.id || req?.user?.userId;
    const records = await this.service.listWomenadnSocilaInclusionForUser(String(me));
    return records.map((r: any) => ({
      id: r.id,
      typeOfMisconduct: r.typeOfMisconduct,
      dateTime: r.dateTime,
      location: r.location,
      detailDescriptionOfIncident: r.detailDescriptionOfIncident,
      reportedBefore: r.reportedBefore,
      medicalHelpNeeded: r.medicalHelpNeeded,
      createdAt: r.createdAt,
    }));
  }

  @ApiOperation({ summary: 'Respond to a submission (reply from recipient to requester)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/respond')
  async respondToSubmission(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: { message: string },
  ) {
    const me = req?.user?.id || req?.user?.userId;
    return this.service.respondToSubmission(String(id), String(me), dto.message);
  }

  @Post('third-party-sexual-assault')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createThirdPartySexualAssault(@Request() req, @Body() dto: CreateThirdPartySexualAssaultDto) {
    const me = req?.user?.id || req?.user?.userId;

    const input: CreateThirdPartySexualAssaultInput = {
      misconductId: dto.misconductId,
      typeOfMisconduct: dto.typeOfMisconduct,
      dateTime: new Date(dto.dateTime),
      location: dto.location ?? null,
      descriptionOfWhatWasObserved: dto.descriptionOfWhatWasObserved ?? null,
      victimUserId: dto.victimUserId ?? null,
    };

    return this.service.createThirdPartySexualAssault(input, String(me));
  }

  @ApiOperation({ summary: 'Get all Third-Party Sexual Assault records (Department Head only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Department_Head)
  @Get('third-party-sexual-assault')
  async listThirdPartySexualAssault() {
    return this.service.listThirdPartySexualAssault();
  }

  @ApiOperation({ summary: 'Get Third-Party Sexual Assault record by id (Department Head only)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.Department_Head)
  @Get('third-party-sexual-assault/:id')
  async getThirdPartySexualAssault(@Param('id') id: string) {
    return this.service.getThirdPartySexualAssault(id);
  }
}

