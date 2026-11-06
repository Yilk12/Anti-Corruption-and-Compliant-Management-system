import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return await (this.prisma as any).setting.findMany();
  }

  async findOne(key: string) {
    const setting = await (this.prisma as any).setting.findUnique({
      where: { settingKey: key },
    });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting;
  }

  async update(key: string, value: string) {
    const setting = await (this.prisma as any).setting.upsert({
      where: { settingKey: key },
      update: { settingValue: value },
      create: { settingKey: key, settingValue: value },
    });
    return setting;
  }

  async bulkUpdate(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) =>
      (this.prisma as any).setting.upsert({
        where: { settingKey: key },
        update: { settingValue: value },
        create: { settingKey: key, settingValue: value },
      }),
    );
    return await this.prisma.$transaction(updates);
  }

  async seedDefaults() {
    const defaultSettings: Record<string, { value: string; description?: string; category?: string }> = {
      // General Settings
      system_name: { value: 'Help-Desk System', description: 'System name displayed in header', category: 'general' },
      logo_url: { value: '', description: 'URL for system logo', category: 'general' },
      timezone: { value: 'Africa/Addis_Ababa', description: 'System timezone', category: 'general' },

      // Module Settings
      enable_users: { value: 'true', description: 'Enable Users module', category: 'module' },
      enable_departments: { value: 'true', description: 'Enable Departments module', category: 'module' },
      enable_assets: { value: 'true', description: 'Enable Assets module', category: 'module' },
      enable_vehicles: { value: 'true', description: 'Enable Vehicles module', category: 'module' },
      enable_tickets: { value: 'true', description: 'Enable Tickets module', category: 'module' },
      enable_knowledge_base: { value: 'true', description: 'Enable Knowledge Base module', category: 'module' },
      enable_analytics: { value: 'true', description: 'Enable Analytics module', category: 'module' },
      enable_advertisements: { value: 'true', description: 'Enable Advertisements module', category: 'module' },
      enable_helpdesk: { value: 'true', description: 'Enable Helpdesk module', category: 'module' },
      enable_disposal: { value: 'true', description: 'Enable Disposal module', category: 'module' },
      enable_maintenance: { value: 'true', description: 'Enable Maintenance module', category: 'module' },
      enable_reports: { value: 'true', description: 'Enable Reports module', category: 'module' },

      // Notification Settings
      email_notifications: { value: 'true', description: 'Enable email notifications', category: 'notification' },
      push_notifications: { value: 'true', description: 'Enable push notifications', category: 'notification' },
    };

    const operations = Object.entries(defaultSettings).map(([key, config]) =>
      (this.prisma as any).setting.upsert({
        where: { settingKey: key },
        update: {
          settingValue: config.value,
          description: config.description,
          category: config.category,
        },
        create: {
          settingKey: key,
          settingValue: config.value,
          description: config.description,
          category: config.category,
        },
      }),
    );

    return await this.prisma.$transaction(operations);
  }
}
