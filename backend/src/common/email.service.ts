import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import  nodemailer from "nodemailer"
import { LocalizationService } from "./localization.service"
import { Language } from "../common/enums/language.enum"
@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter

  constructor(
    private configService: ConfigService,
    private localizationService: LocalizationService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST"),
      port: this.configService.get<number>("SMTP_PORT"),
      secure: false,
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    })
  }

  async sendTicketCreatedEmail(
    to: string,
    ticketTitle: string,
    ticketId: string,
    creatorName: string,
    language: Language = Language.EN,
  ) {
    const subject = this.localizationService.translate("email.ticket.created.subject", language, { title: ticketTitle })

    const html = this.generateTicketCreatedTemplate(ticketTitle, ticketId, creatorName, language)

    return this.sendEmail(to, subject, html)
  }

  async sendTicketAssignedEmail(
    to: string,
    ticketTitle: string,
    ticketId: string,
    assigneeName: string,
    language: Language = Language.EN,
  ) {
    const subject = this.localizationService.translate("email.ticket.assigned.subject", language, {
      title: ticketTitle,
    })

    const html = this.generateTicketAssignedTemplate(ticketTitle, ticketId, assigneeName, language)

    return this.sendEmail(to, subject, html)
  }

  async sendTicketStatusUpdateEmail(
    to: string,
    ticketTitle: string,
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    language: Language = Language.EN,
  ) {
    const subject = `Ticket Status Updated: ${ticketTitle}`

    const html = this.generateTicketStatusUpdateTemplate(ticketTitle, ticketId, oldStatus, newStatus, language)

    return this.sendEmail(to, subject, html)
  }

  async sendWelcomeEmail(to: string, userName: string, language: Language = Language.EN) {
    const subject = this.localizationService.translate("notification.welcome", language)

    const html = this.generateWelcomeTemplate(userName, language)

    return this.sendEmail(to, subject, html)
  }

  async sendPasswordResetEmail(to: string, resetToken: string, language: Language = Language.EN) {
    const subject = "Password Reset Request"
    const resetUrl = `${this.configService.get<string>("FRONTEND_URL")}/reset-password?token=${resetToken}`

    const html = this.generatePasswordResetTemplate(resetUrl, language)

    return this.sendEmail(to, subject, html)
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>("SMTP_USER"),
        to,
        subject,
        html,
      })

      console.log("Email sent:", info.messageId)
      return { success: true, messageId: info.messageId }
    } catch (error) {
      console.error("Email sending failed:", error)
      return { success: false, error: error.message }
    }
  }

  private generateTicketCreatedTemplate(
    ticketTitle: string,
    ticketId: string,
    creatorName: string,
    language: Language,
  ): string {
    const baseUrl = this.configService.get<string>("FRONTEND_URL")
    const ticketUrl = `${baseUrl}/tickets/${ticketId}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Ticket Created</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>New Ticket Created</h3>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <p><strong>Created by:</strong> ${creatorName}</p>
            <p>A new support ticket has been created and is awaiting assignment.</p>
            <p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateTicketAssignedTemplate(
    ticketTitle: string,
    ticketId: string,
    assigneeName: string,
    language: Language,
  ): string {
    const baseUrl = this.configService.get<string>("FRONTEND_URL")
    const ticketUrl = `${baseUrl}/tickets/${ticketId}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Assigned</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Ticket Assigned to You</h3>
            <p>Hello ${assigneeName},</p>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <p>A support ticket has been assigned to you. Please review and take appropriate action.</p>
            <p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateTicketStatusUpdateTemplate(
    ticketTitle: string,
    ticketId: string,
    oldStatus: string,
    newStatus: string,
    language: Language,
  ): string {
    const baseUrl = this.configService.get<string>("FRONTEND_URL")
    const ticketUrl = `${baseUrl}/tickets/${ticketId}`

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket Status Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .status-change { background-color: #e6f3ff; padding: 15px; border-left: 4px solid #0f766e; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Ticket Status Updated</h3>
            <p><strong>Ticket ID:</strong> ${ticketId}</p>
            <p><strong>Title:</strong> ${ticketTitle}</p>
            <div class="status-change">
              <p><strong>Status changed from:</strong> ${oldStatus} → ${newStatus}</p>
            </div>
            <p>
              <a href="${ticketUrl}" class="button">View Ticket</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generateWelcomeTemplate(userName: string, language: Language): string {
    const baseUrl = this.configService.get<string>("FRONTEND_URL")

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Welcome ${userName}!</h3>
            <p>${this.localizationService.translate("notification.welcome", language)}</p>
            <p>You can now:</p>
            <ul>
              <li>Create and track support tickets</li>
              <li>Access our knowledge base</li>
              <li>Get help from our support team</li>
            </ul>
            <p>
              <a href="${baseUrl}" class="button">Access Helpdesk</a>
            </p>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  private generatePasswordResetTemplate(resetUrl: string, language: Language): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0f766e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 10px 20px; background-color: #0f766e; color: white; text-decoration: none; border-radius: 5px; }
          .warning { background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 15px 0; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ethiopian Civil Service Commission</h1>
            <h2>Helpdesk System</h2>
          </div>
          <div class="content">
            <h3>Password Reset Request</h3>
            <p>You have requested to reset your password. Click the button below to set a new password:</p>
            <p>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>Security Notice:</strong> This link will expire in 1 hour. If you did not request this password reset, please ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>Ethiopian Civil Service Commission - Helpdesk System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
