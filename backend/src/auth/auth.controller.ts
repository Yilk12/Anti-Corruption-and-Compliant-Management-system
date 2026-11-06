import { Controller, Post, Body, Res, UseGuards, Req } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import { RegisterDto } from "./dto/register.dto"
import { LoginDto } from "./dto/login.dto"
import { Request, Response } from "express"
import { ChangePasswordDto } from "./dto/change-password.dto"
import { JwtAuthGuard } from "./guards/jwt-auth.guard"

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "User registration" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiBody({ type: RegisterDto })
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @ApiOperation({ summary: "User signup (alias of register)" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "User already exists" })
  @ApiBody({ type: RegisterDto })
  @Post("signup")
  async signup(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful, returns JWT" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  @ApiBody({ type: LoginDto })

  // login functionality
@Post("login")
async login(
  @Body() loginDto: LoginDto,
  @Res({ passthrough: true }) res: Response
) {
  const data = await this.authService.login(loginDto)

  // Set the cookie
  const secure = process.env.NODE_ENV === "production"
  const domain = process.env.COOKIE_DOMAIN || undefined
  res.cookie("access_token", data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: 15 * 60 * 1000, // 15 minutes
  })

  // Return user + access_token in the response body
  return {
    access_token: data.access_token,
    user: data.user,
    
  }
}


  @ApiOperation({ summary: "User logout" })
  @ApiResponse({ status: 200, description: "Logout successful" })
  @Post("logout")
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("access_token", { path: "/" })
    return { message: "Logged out successfully" }
  }

   @ApiOperation({ summary: "Change user password" })
  @ApiResponse({ status: 200, description: "Password changed successfully" })
  @ApiResponse({ status: 400, description: "Invalid password or policy violation" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: Request
  ) {
    // Extract user ID from JWT token
    const userId = (req as any)?.user?.userId as string
    
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
