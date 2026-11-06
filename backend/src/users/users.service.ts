import { Injectable, NotFoundException, ConflictException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateUserDto } from "./dto/create-user.dto"
import { UserType } from "../common/enums/user-type.enum"
import { UserRole } from "../common/enums/user-role.enum"
import * as bcrypt from 'bcryptjs'
import { UpdateUserDto } from "./dto/updateUserDto"

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private isUuid(value: string | null | undefined): boolean {
    if (!value) return false;
    const v = String(value).trim();
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(v);
  }

  async create(createUserDto: CreateUserDto) {
    const { modulePermissions, departmentName, departmentId: dtoDepartmentId, ...userData } = createUserDto; // accept departmentId or departmentName
    const randomPassword = "password123";
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // Ensure email uniqueness (friendlier error than raw DB constraint)
    const existingUser = await this.prisma.user.findUnique({ where: { email: userData.email } });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }

    // Ensure employeeId uniqueness if provided
    if (userData.employeeId) {
      const existingEmployeeId = await this.prisma.user.findUnique({ where: { employeeId: userData.employeeId } });
      if (existingEmployeeId) {
        throw new ConflictException("Employee ID already exists");
      }
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      let departmentId: string | null = null;

      if (dtoDepartmentId && this.isUuid(dtoDepartmentId)) {
        departmentId = dtoDepartmentId;
      } else if (departmentName) {
        const dept = await prisma.department.findFirst({ where: { name: departmentName } });
        departmentId = dept ? dept.id : null;
      } else if (dtoDepartmentId) {
        const dept = await prisma.department.findFirst({ where: { name: dtoDepartmentId } });
        departmentId = dept ? dept.id : null;
      }

      // If no department is provided, assign a default department
      if (!departmentId) {
        const defaultDept = await prisma.department.findFirst({
          where: { isActive: true }
        });
        departmentId = defaultDept ? defaultDept.id : null;
      }
  
      // 1. Create the user
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
          isActive: userData.isActive ?? true,
          departmentId: departmentId, // assign FK
          roles: userData.roles || [],
        } as any,
        select: {
          id: true,
          email: true,
          firstName: true,
          middleName: true,
          lastName: true,
          firstNameAm: true,
          middleNameAm: true,
          lastNameAm: true,
          phone: true,
          employeeId: true,
          position: true,
          gender: true,
          isDisabled: true,
          disabilityType: true,
          roles: true,
          userType: true,
          departmentId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        } as any,
      });
  
      // 2. Process module permissions if provided
      if (modulePermissions && modulePermissions.length > 0) {
        for (const modulePerm of modulePermissions) {
          // Find or create module
          const moduleName = modulePerm.moduleName.toLowerCase().trim();
          const module = await prisma.module.upsert({
            where: { name: moduleName },
            update: {},
            create: { name: moduleName },
          });

          for (const action of modulePerm.permissions) {
            // Find or create permission
            const actionName = action.toLowerCase().trim();
            const permission = await prisma.permission.upsert({
              where: { action: actionName },
              update: {},
              create: { action: actionName },
            });

            // Assign user permission
            await prisma.userPermission.create({
              data: {
                userId: user.id,
                moduleId: module.id,
                permissionId: permission.id as any,
              } as any,
            });
          }
        }
      }
  
      return user;
    });
  
    return {
      ...result,
      password: randomPassword, // return plain password for initial login
    };
  }
  
  

  async createAdminWithPermissions(createUserDto: CreateUserDto) {
    const randomPassword = "password123";
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const result = await this.prisma.$transaction(async (prisma) => {
      // 1. Create the admin user
      const user = await prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
          isActive: true,
        } as any,
        select: {
          id: true,
          email: true,
          firstName: true,
          middleName: true,
          lastName: true,
          firstNameAm: true,
          middleNameAm: true,
          lastNameAm: true,
          phone: true,
          gender: true,
          isDisabled: true,
          disabilityType: true,
          roles: true,
          userType: true,
          departmentId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        } as any,
      });

      // 2. Create default modules and permissions for admin
      const defaultModules = [
        { 
          name: 'ticket_management', 
          permissions: ['view', 'create', 'edit', 'delete', 'assign', 'manage'] 
        },
        { 
          name: 'user_management', 
          permissions: ['view', 'create', 'edit', 'delete', 'manage'] 
        },
        { 
          name: 'knowledge_base', 
          permissions: ['view', 'create', 'edit', 'delete', 'manage'] 
        },
        { 
          name: 'analytics', 
          permissions: ['view', 'create', 'export', 'manage'] 
        },
        { 
          name: 'system_settings', 
          permissions: ['view', 'edit', 'manage'] 
        }
      ];

      for (const moduleData of defaultModules) {
        let module = await prisma.module.findFirst({
          where: { name: moduleData.name }
        });

        if (!module) {
          module = await prisma.module.create({
            data: { name: moduleData.name }
          });
        }

        for (const action of moduleData.permissions) {
          let permission = await prisma.permission.findFirst({
            where: { action }
          });

          if (!permission) {
            permission = await prisma.permission.create({
              data: { action }
            });
          }

          await prisma.userPermission.create({
            data: {
              userId: user.id,
              moduleId: module.id,
              permissionId: permission.id as any,
            } as any,
          });
        }
      }

      return user;
    });

    return {
      ...result,
      password: randomPassword,
    };
  }

async findAll(page: number = 1, limit: number = 10, role?: UserRole, search?: string) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Math.min(100, Number(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    ...(role && { roles: { has: role } }),
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    this.prisma.user.findMany({
      where,
      skip,
      take: limitNum,
      include: {
        userPermissions: {
          include: {
            module: { select: { id: true, name: true } },
            permission: { select: { id: true, action: true } }
          }
        },
        department: {
          select: {
            id: true,
            name: true // <-- include department name
          }
        }
      },
      orderBy: { createdAt: "desc" },
    }),
    this.prisma.user.count({ where }),
  ]);

  const usersWithPermissions = users.map(user => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    firstNameAm: user.firstNameAm,
    middleNameAm: user.middleNameAm,
    lastNameAm: user.lastNameAm,
    phone: user.phone,
    employeeId: user.employeeId,
    position: user.position,
    gender: user.gender,
    isDisabled: user.isDisabled,
    disabilityType: user.disabilityType,
    roles: (user as any).roles,
    userType: user.userType,
    department: user.department ? user.department.name : null,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    modulePermissions: this.transformUserPermissions(user.userPermissions),
  }));

  return {
    users: usersWithPermissions,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}


  // List all department heads with their department info
  async listDepartmentHeads() {
    const heads = await this.prisma.user.findMany({
      where: { roles: { has: UserRole.Department_Head }, isActive: true } as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      } as any,
      orderBy: { firstName: 'asc' },
    })
    return heads.map(h => ({
      id: h.id,
      email: h.email,
      firstName: h.firstName,
      lastName: h.lastName,
      departmentId: h.departmentId,
      department: (h as any).department ? { id: (h as any).department.id, name: (h as any).department.name } : null,
    }))
  }

  // List users by departmentId
  async listUsersByDepartment(departmentId: string) {
    const users = await this.prisma.user.findMany({
      where: { departmentId, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        roles: true,
      } as any,
      orderBy: { firstName: 'asc' },
    })
    return users
  }

  // List all disabled users with full core information
  async listDisabledUsers() {
    const users = await this.prisma.user.findMany({
      where: { isDisabled: true },
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        firstNameAm: true,
        middleNameAm: true,
        lastNameAm: true,
        phone: true,
        gender: true,
        isDisabled: true,
        disabilityType: true,
        roles: true,
        userType: true,
        department: {
          select: { id: true, name: true, nameAm: true },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      } as any,
    })

    return users.map((u) => ({
      ...u,
      departmentId: (u as any).department?.id ?? null,
      departmentName: (u as any).department?.name ?? null,
      departmentNameAm: (u as any).department?.nameAm ?? null,
    }))
  }

  // List all active drivers (role = Driver)
  async listDrivers() {
    const users = await this.prisma.user.findMany({
      where: { roles: { has: UserRole.Driver }, isActive: true } as any,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        roles: true,
      } as any,
      orderBy: { firstName: 'asc' },
    });

    return users.map((u) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      phone: u.phone,
      roles: (u as any).roles,
    }));
  }

  async setRoles(id: string, roles: UserRole[]) {
    await this.findById(id)
    const updated = await this.prisma.user.update({
      where: { id },
      data: { roles } as any,
      include: {
        userPermissions: {
          include: {
            module: { select: { id: true, name: true } },
            permission: { select: { id: true, action: true } },
          },
        },
      },
    })

    return {
      id: updated.id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      employeeId: updated.employeeId,
      gender: updated.gender,
      isDisabled: updated.isDisabled,
      disabilityType: updated.disabilityType,
      roles: (updated as any).roles,
      userType: updated.userType,
      department: updated.departmentId,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      modulePermissions: this.transformUserPermissions((updated as any).userPermissions),
    }
  }

  async findById(id: string) {
    // Validate UUID format
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid user ID: ID must be a non-empty string')
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      throw new Error(`Invalid user ID format: ${id} is not a valid UUID`)
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            nameAm: true,
          }
        },
        userPermissions: {
          include: {
            module: {
              select: {
                id: true,
                name: true,
              }
            },
            permission: {
              select: {
                id: true,
                action: true,
              }
            }
          }
        }
      },
    })

    if (!user) {
      throw new NotFoundException("User not found")
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      employeeId: user.employeeId,
      position: user.position,
      gender: user.gender,
      isDisabled: user.isDisabled,
      disabilityType: user.disabilityType,
      roles: (user as any).roles,
      userType: user.userType,
      department: user.department?.name || null,
      departmentId: user.departmentId,
      isActive: user.isActive,
      photoUrl: (user as any).photoUrl ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      modulePermissions: this.transformUserPermissions(user.userPermissions)
    }
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userPermissions: {
          include: {
            module: {
              select: {
                id: true,
                name: true,
              }
            },
            permission: {
              select: {
                id: true,
                action: true,
              }
            }
          }
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      roles: (user as any).roles,
      userType: user.userType,
      departmentId: user.departmentId,
      departmentName: user.department ? user.department.name : null,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      modulePermissions: this.transformUserPermissions(user.userPermissions)
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.findById(id);

      const { modulePermissions, departmentName, departmentId: dtoDepartmentId, ...userData } = updateUserDto;

      // Determine if department should be updated. Only include in update when explicitly provided
      let departmentUpdate: { departmentId: string | null } | {} = {};
      if (dtoDepartmentId !== undefined) {
        const trimmed = dtoDepartmentId?.trim?.() ?? '';
        if (!trimmed) {
          departmentUpdate = { departmentId: null };
        } else if (this.isUuid(trimmed)) {
          departmentUpdate = { departmentId: trimmed };
        } else {
          const dept = await this.prisma.department.findFirst({ where: { name: trimmed } });
          departmentUpdate = { departmentId: dept ? dept.id : null };
        }
      } else if (departmentName !== undefined) {
        const dept = await this.prisma.department.findFirst({ where: { name: departmentName } });
        departmentUpdate = { departmentId: dept ? dept.id : null };
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        // 1️⃣ Update user, exclude password in the returned object
        const updatedUser = await prisma.user.update({
          where: { id },
          data: {
            ...userData,
            ...departmentUpdate,
            roles: userData.roles || [],
          } as any,
          select: {
            id: true,
            email: true,
            firstName: true,
            middleName: true,
            lastName: true,
            firstNameAm: true,
            middleNameAm: true,
            lastNameAm: true,
            phone: true,
            gender: true,
            isDisabled: true,
            disabilityType: true,
            roles: true,
            userType: true,
            departmentId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          } as any,
        });

        // 2️⃣ Handle modulePermissions
        if (modulePermissions && modulePermissions.length > 0) {
          // Remove all old permissions
          await prisma.userPermission.deleteMany({ where: { userId: id } });

          for (const modulePerm of modulePermissions) {
            const moduleName = modulePerm.moduleName.toLowerCase().trim();
            const module = await prisma.module.upsert({
              where: { name: moduleName },
              update: {},
              create: { name: moduleName },
            });

            for (const action of modulePerm.permissions) {
              const actionName = action.toLowerCase().trim();
              const permission = await prisma.permission.upsert({
                where: { action: actionName },
                update: {},
                create: { action: actionName },
              });

              await prisma.userPermission.create({
                data: {
                  userId: id,
                  moduleId: module.id,
                  permissionId: permission.id,
                },
              });
            }
          }
        }

        return updatedUser; // password is no longer included
      });

      return result;
    } catch (e) {
      console.error('🔥 Update user error:', e);
      throw e; // rethrow so Nest handles it
    }
  }

 async remove(id: string) {
  // 1️⃣ Ensure user exists
  await this.findById(id);

  // 2️⃣ Delete related userPermissions first
  await this.prisma.userPermission.deleteMany({
    where: { userId: id },
  });

  // 3️⃣ Delete the user
  const deletedUser = await this.prisma.user.delete({
    where: { id },
  });

  // 4️⃣ Return a clean response
  return {
    id: deletedUser.id,
    email: deletedUser.email,
    firstName: deletedUser.firstName,
    lastName: deletedUser.lastName,
  };
}


  async getUserStats() {
    const [total, active, allUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.findMany({ select: { roles: true } } as any),
    ])

    const byRole: Record<string, number> = {}
    for (const user of allUsers) {
      for (const role of (user as any).roles) {
        byRole[role] = (byRole[role] || 0) + 1
      }
    }

    return {
      total,
      active,
      inactive: total - active,
      byRole,
    }
  }

  // Gender and disability distribution across all users
  async getGenderAndDisabilityStats() {
    const [male, female, disabled, normal] = await Promise.all([
      this.prisma.user.count({ where: { gender: 'MALE' as any } }),
      this.prisma.user.count({ where: { gender: 'FEMALE' as any } }),
      this.prisma.user.count({ where: { isDisabled: true } }),
      this.prisma.user.count({ where: { isDisabled: false } }),
    ])

    const total = male + female + (await this.prisma.user.count({ where: { gender: null as any } }))

    return {
      total,
      gender: {
        male,
        female,
      },
      disability: {
        disabled,
        normal,
      },
    }
  }

  // Helper method to transform permissions into module-based structure
  private transformUserPermissions(userPermissions: any[]) {
    const modulePermissions: Record<string, string[]> = {}

    userPermissions.forEach(up => {
      const moduleName = up.module.name
      const permissionAction = up.permission.action

      if (!modulePermissions[moduleName]) {
        modulePermissions[moduleName] = []
      }

      if (!modulePermissions[moduleName].includes(permissionAction)) {
        modulePermissions[moduleName].push(permissionAction)
      }
    })

    return modulePermissions
  }

  // Basic list of users: email, firstName, lastName, accountStatus
  async listBasicUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        firstNameAm: true,
        lastNameAm: true,
        roles: true,
        accountStatus: true,
        position: true,
        departmentId: true,
      } as any,
      orderBy: { firstName: 'asc' },
    });
    return users;
  }

  // List investigators (users with Ethics_Officer or ethics_officer role)
  async listInvestigators() {
    try {
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          roles: true,
          position: true,
        },
      });
      
      // Filter users with ethics-related roles
      const ethicsUsers = users.filter(user => {
        const userRoles = user.roles || [];
        return userRoles.some(role => 
          role.toLowerCase().includes('ethics') || 
          role.toLowerCase().includes('officer')
        );
      });
      
      return ethicsUsers;
    } catch (error) {
      console.error('Error in listInvestigators:', error);
      return [];
    }
  }

  // Update a user's account status (ENABLED/DISABLED)
  async updateAccountStatus(id: string, accountStatus: 'ENABLED' | 'DISABLED') {
    await this.findById(id)
    const updated = await this.prisma.user.update({
      where: { id },
      data: { accountStatus },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
      },
    })
    return updated
  }

  // Reset a user's password to default (password123)
  async resetPasswordToDefault(id: string) {
    await this.findById(id)
    const defaultPassword = "password123"
    const hashed = await bcrypt.hash(defaultPassword, 12)
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    })
    return { ...updated, message: "Password reset to default" }
  }
}