import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        published: dto.published ?? false,
        author: { connect: { id: dto.authorId } },
      },
    })
  }

  async findAll(params: { authorId?: string }) {
    const { authorId } = params
    return this.prisma.post.findMany({
      where: { authorId: authorId || undefined },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException('Post not found')
    return post
  }

  async update(id: string, dto: UpdatePostDto) {
    await this.ensureExists(id)
    return this.prisma.post.update({
      where: { id },
      data: {
        title: dto.title ?? undefined,
        content: dto.content ?? undefined,
        published: dto.published ?? undefined,
      },
    })
  }

  async remove(id: string) {
    await this.ensureExists(id)
    await this.prisma.post.delete({ where: { id } })
    return { id, deleted: true }
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.post.findUnique({ where: { id } })
    if (!exists) throw new NotFoundException('Post not found')
  }
}
