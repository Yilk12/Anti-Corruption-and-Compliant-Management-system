import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { CreateDepartmentDto } from "./dto/create-department.dto"
import { UpdateDepartmentDto } from "./dto/update-department.dto"
import { UserRole } from "../common/enums/user-role.enum"

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    const name = (dto.name || '').trim()
    if (!name) {
      throw new BadRequestException('Department name is required')
    }

    // Validate unique name (case-insensitive)
    const exists = await this.prisma.department.findFirst({
      where: { name: { equals: name, mode: 'insensitive' as const } },
      select: { id: true },
    })
    if (exists) {
      throw new BadRequestException('Department name already exists')
    }

    const created = await this.prisma.department.create({
      data: {
        name,
        nameAm: dto.nameAm ?? null,
        description: dto.description ?? null,
        isActive: dto.isActive ?? true,
      },
      select: {
        id: true,
        name: true,
        nameAm: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return created
  }

  async findAll(page?: number, limit?: number, search?: string) {
    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 10;
    const skip = (pageNumber - 1) * pageLimit;
    console.log("this is the user role",UserRole)
  
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { nameAm: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };
  
    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: pageLimit,
        select: {
          id: true,
          name: true,
          nameAm: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.department.count({ where }),
    ]);
  
    return {
      departments: items,
      pagination: {
        total,
        page: pageNumber,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
      
    };
  }
  

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        nameAm: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    if (!department) throw new NotFoundException("Department not found")
    return department
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findById(id)
    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        name: dto.name,
        nameAm: dto.nameAm,
        description: dto.description,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        name: true,
        nameAm: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })
    return updated
  }

  async deactivate(id: string) {
    await this.findById(id)
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    })
  }
}
