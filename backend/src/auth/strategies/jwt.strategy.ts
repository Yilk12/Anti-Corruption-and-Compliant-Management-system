import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service"; // adjust path

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "dev-insecure-secret-change-me",
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Validating token with payload:', payload);
    
    // Fetch the user from DB
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        roles: true,
        userType: true,
        departmentId: true,
        firstName: true,
        lastName: true,
      } as any,
    });

    console.log('[JwtStrategy] User found:', !!user, 'User ID:', user?.id);

    if (!user) {
      throw new UnauthorizedException();
    }

    const result = {
      id: user.id,
      sub: user.id,
      userId: user.id,
      email: user.email,
      roles: (user as any).roles,
      userType: user.userType,
      departmentId: user.departmentId,
      firstName: (user as any).firstName,
      lastName: (user as any).lastName,
    };
    
    console.log('[JwtStrategy] Returning user data:', { id: result.id, roles: result.roles });
    return result;
  }
}
