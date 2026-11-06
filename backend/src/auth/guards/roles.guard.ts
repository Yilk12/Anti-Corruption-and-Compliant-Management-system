import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { UserRole } from "../../common/enums/user-role.enum"
import { ROLES_KEY } from "../decorators/roles.decorator"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    console.log('[RolesGuard] Required roles:', requiredRoles);

    // If no roles are required, allow
    if (!requiredRoles) {
      return true
    }

    const { user } = context.switchToHttp().getRequest()

    console.log('[RolesGuard] User from request:', user);
    console.log('[RolesGuard] User roles:', user?.roles || user?.user?.roles);

    // Block unauthenticated requests
    if (!user) {
      console.log('[RolesGuard] No user found in request');
      return false
    }

    // Enforce that the user's role matches at least one of the required roles
    const roles: string[] | undefined = user.roles || user?.user?.roles
    if (!roles || roles.length === 0) {
      console.log('[RolesGuard] No roles found for user');
      return false
    }
    
    // Case-insensitive role matching
    const normalizedUserRoles = roles.map(r => r.toLowerCase())
    const hasAccess = requiredRoles.some(requiredRole => 
      normalizedUserRoles.includes(requiredRole.toLowerCase())
    )
    
    console.log('[RolesGuard] Normalized user roles:', normalizedUserRoles);
    console.log('[RolesGuard] Has access:', hasAccess);
    
    return hasAccess
  }
}
