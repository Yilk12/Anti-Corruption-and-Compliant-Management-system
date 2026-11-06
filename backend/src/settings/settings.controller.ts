import { Controller, Get, Post, Body, Put, Param } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async findAll() {
    return await this.settingsService.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a setting by key' })
  @ApiResponse({ status: 200, description: 'Setting retrieved successfully' })
  async findOne(@Param('key') key: string) {
    return await this.settingsService.findOne(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a setting' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully' })
  async update(@Param('key') key: string, @Body('value') value: string) {
    return await this.settingsService.update(key, value);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Update multiple settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async bulkUpdate(@Body() settings: Record<string, string>) {
    return await this.settingsService.bulkUpdate(settings);
  }

  @Post('seed-defaults')
  @ApiOperation({ summary: 'Seed default settings' })
  @ApiResponse({ status: 200, description: 'Default settings seeded successfully' })
  async seedDefaults() {
    return await this.settingsService.seedDefaults();
  }
}
