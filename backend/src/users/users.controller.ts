import { Controller, Get, Post, Patch, Param, Delete, UseGuards, Query, Body, ConflictException, ParseIntPipe, DefaultValuePipe, BadRequestException, UploadedFile, UseInterceptors, Req } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRole } from "../common/enums/user-role.enum";
import { UserType } from "../common/enums/user-type.enum";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { Request } from "express";
import { RegisterAdminDto } from "./dto/RegisterAdminDto";
import { UpdateUserDto } from "./dto/updateUserDto";
import { SetRoleDto } from "./dto/set-role.dto";

@ApiTags("Users")
@ApiBearerAuth()
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ---------------------------
  // Public endpoint to create first admin
  // ---------------------------
  @Post("register-admin")
  @ApiOperation({ summary: "Register the first admin (public, no auth required)" })
  async registerAdmin(@Body() dto: RegisterAdminDto) {
    const existingAdmins = await this.usersService.findAll(1, 1, UserRole.ADMIN)
    if (existingAdmins.pagination.total > 0) {
      throw new ConflictException("Admin already exists")
    }

    return this.usersService.createAdminWithPermissions({
      ...dto,
      roles: [UserRole.ADMIN],
      userType: UserType.INTERNAL,
      isActive: true,
    })
  }

  // -------------------------------------
  // Protected endpoints to register user
  // --------------------------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get all users with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "role", required: false, enum: UserRole })
  @ApiQuery({ name: "search", required: false, type: String })
  @Roles(UserRole.ADMIN, UserRole.Commissioner, UserRole.Department_Head, UserRole.Ethics_Anti_Corruption, UserRole.END_USER, UserRole.Driver, UserRole.Maintenace_Team, UserRole.Announcement_Creator, UserRole.Women_Social_Inclusion, UserRole.Ethics_Officer, UserRole.Finance_Department, UserRole.Vehicle_Inspector, UserRole.Feedback_Complaint_Manager)
  @Get()
  findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query("role") role?: UserRole,
    @Query("search") search?: string
  ) {
    return this.usersService.findAll(page, limit, role, search);
  }

  // Lightweight endpoints for feedback UI
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List department heads (id, name, department)" })
  @Get("department-heads")
  listDepartmentHeads() {
    return this.usersService.listDepartmentHeads();
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List users by departmentId" })
  @Get("by-department")
  listByDepartment(@Query('departmentId') departmentId?: string) {
    if (!departmentId) throw new BadRequestException('departmentId is required');
    return this.usersService.listUsersByDepartment(departmentId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user statistics" })
  @Get("stats")
  getUserStats() {
    return this.usersService.getUserStats();
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get gender and disability distribution for users" })
  @Get("stats/gender-disability")
  getGenderAndDisabilityStats() {
    return this.usersService.getGenderAndDisabilityStats();
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List all active drivers (role = Driver)" })
  @Get("drivers")
  listDrivers() {
    return this.usersService.listDrivers();
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List users (basic): email, firstName, lastName, accountStatus" })
  @Get("basic")
  listBasicUsers() {
    return this.usersService.listBasicUsers();
  }

  @ApiOperation({ summary: "List investigators (users with Ethics_Officer role)" })
  @Get("investigators")
  async listInvestigators() {
    console.log('listInvestigators endpoint called');
    try {
      const result = await this.usersService.listInvestigators();
      console.log('listInvestigators result:', result);
      return result;
    } catch (error) {
      console.error('listInvestigators error:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "List all disabled users with full information" })
  @Get("disabled")
  listDisabledUsers() {
    return this.usersService.listDisabledUsers();
  }

  // Roles endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "List all available roles" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Get("roles")
  listRoles() {
    return { roles: Object.values(UserRole) };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Set a user's roles" })
  @ApiResponse({ status: 200, description: "User roles updated" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Patch(":id/role")
  setRole(@Param("id") id: string, @Body() dto: SetRoleDto) {
    return this.usersService.setRoles(id, [dto.role as any]);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Get user by ID" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    try {
      return this.usersService.findById(id);
    } catch (error: any) {
      throw new Error(`Failed to find user with ID ${id}: ${error.message}`);
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Update user" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Patch(":id")
  update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Reset user's password to default (password123)" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Patch(":id/reset-password")
  resetPassword(@Param("id") id: string) {
    return this.usersService.resetPasswordToDefault(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Update user's account status (ENABLED/DISABLED)" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Patch(":id/account-status")
  updateAccountStatus(
    @Param("id") id: string,
    @Body() body: { accountStatus: 'ENABLED' | 'DISABLED' }
  ) {
    if (!body?.accountStatus || !['ENABLED', 'DISABLED'].includes(body.accountStatus)) {
      throw new BadRequestException('accountStatus must be ENABLED or DISABLED')
    }
    return this.usersService.updateAccountStatus(id, body.accountStatus)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: "Deactivate user" })
  @Roles(UserRole.ADMIN, UserRole.Commissioner)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

}