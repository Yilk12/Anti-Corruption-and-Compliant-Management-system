import { Controller, Get, Post as HttpPost, Body, Patch, Param, Delete, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger'
import { PostsService } from './posts.service'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'

@ApiTags('posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiCreatedResponse({ description: 'Post created' })
  create(@Body() dto: CreatePostDto) {
    return this.postsService.create(dto)
  }

  @Get()
  @ApiOperation({ summary: 'List posts' })
  @ApiOkResponse({ description: 'List of posts' })
  @ApiQuery({ name: 'authorId', required: false })
  findAll(@Query('authorId') authorId?: string) {
    return this.postsService.findAll({ authorId })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'The post' })
  findOne(@Param('id') id: string) {
    return this.postsService.findOne(id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Updated post' })
  update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    return this.postsService.update(id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post by id' })
  @ApiParam({ name: 'id' })
  @ApiOkResponse({ description: 'Deleted' })
  remove(@Param('id') id: string) {
    return this.postsService.remove(id)
  }
}
