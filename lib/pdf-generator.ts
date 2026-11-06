import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generateUserManualPDF = () => {
  const doc = new jsPDF()
  let yPosition = 20
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const lineHeight = 7

  // Helper function to check if we need a new page
  const checkNewPage = (additionalSpace: number = 0) => {
    if (yPosition + additionalSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
  }

  // Title
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Digital CSC - Asset Management System', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(16)
  doc.text('User Manual', margin, yPosition)
  yPosition += lineHeight * 3

  // Reset font
  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  // Table of Contents
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Table of Contents', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const tocItems = [
    '1. Introduction',
    '2. Asset Management System',
    '   2.1 Asset Registration',
    '   2.2 Asset Request',
    '   2.3 Asset Transfer',
    '   2.4 Asset Return',
    '   2.5 Asset Stock Card',
    '   2.6 Asset Bin Card',
    '   2.7 Request Workflow',
    '   2.8 Asset Inspection',
    '   2.9 Vehicle Inspection',
    '   2.10 Maintenance Request',
    '   2.11 Asset Disposal',
    '3. Helpdesk System',
    '   3.1 Tickets Workflow',
    '   3.2 Knowledge Base',
    '4. User Roles and Permissions',
    '5. Getting Started',
    '6. Troubleshooting'
  ]

  tocItems.forEach(item => {
    checkNewPage()
    doc.text(item, margin, yPosition)
    yPosition += lineHeight
  })

  yPosition += lineHeight * 2

  // Introduction
  doc.addPage()
  yPosition = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('1. Introduction', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const introText = 'The Digital CSC Asset Management System is a comprehensive platform designed to manage organizational assets efficiently. This manual provides step-by-step instructions for using all features of the system, including asset management, helpdesk operations, and reporting tools.'
  
  const splitIntro = doc.splitTextToSize(introText, doc.internal.pageSize.width - margin * 2)
  splitIntro.forEach((line: string) => {
    checkNewPage()
    doc.text(line, margin, yPosition)
    yPosition += lineHeight
  })

  yPosition += lineHeight

  // Asset Management System
  doc.addPage()
  yPosition = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('2. Asset Management System', margin, yPosition)
  yPosition += lineHeight * 2

  // Asset Registration
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('2.1 Asset Registration', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Purpose: Register new assets into the system for tracking and management.', margin, yPosition)
  yPosition += lineHeight
  doc.text('Access: Admin, Manager, Department Head, Asset Officer', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFont('helvetica', 'bold')
  doc.text('Steps:', margin, yPosition)
  yPosition += lineHeight

  doc.setFont('helvetica', 'normal')
  const registrationSteps = [
    '1. Navigate to the sidebar and click "Register Asset"',
    '2. Fill in the required asset information:',
    '   - Asset Tag: Unique identifier for the asset',
    '   - Asset Name: Descriptive name of the asset',
    '   - Category: Select appropriate category',
    '   - Serial Number: Manufacturer serial number',
    '   - Purchase Date: Date of acquisition',
    '   - Purchase Cost: Cost of the asset',
    '   - Location: Physical location',
    '   - Department: Department responsible',
    '   - Condition: Current condition',
    '   - Description: Additional details',
    '3. Upload supporting documents if available',
    '4. Click "Save" or "Register" to complete'
  ]

  registrationSteps.forEach(step => {
    checkNewPage()
    const splitStep = doc.splitTextToSize(step, doc.internal.pageSize.width - margin * 2)
    splitStep.forEach((line: string) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
  })

  yPosition += lineHeight

  // Asset Request
  doc.addPage()
  yPosition = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('2.2 Asset Request', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Purpose: Request new assets or additional equipment for departmental use.', margin, yPosition)
  yPosition += lineHeight
  doc.text('Access: All Users', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFont('helvetica', 'bold')
  doc.text('Steps:', margin, yPosition)
  yPosition += lineHeight

  doc.setFont('helvetica', 'normal')
  const requestSteps = [
    '1. Navigate to "Asset Requests" from the sidebar',
    '2. Click "New Request"',
    '3. Fill in the request details:',
    '   - Asset Type: Category of asset needed',
    '   - Quantity: Number of assets required',
    '   - Justification: Reason for the request',
    '   - Priority: Urgency level',
    '   - Required Date: Date by which asset is needed',
    '4. Submit the request for approval'
  ]

  requestSteps.forEach(step => {
    checkNewPage()
    const splitStep = doc.splitTextToSize(step, doc.internal.pageSize.width - margin * 2)
    splitStep.forEach((line: string) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
  })

  yPosition += lineHeight

  // Asset Transfer
  doc.addPage()
  yPosition = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('2.3 Asset Transfer', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Purpose: Transfer assets between employees, departments, or locations.', margin, yPosition)
  yPosition += lineHeight
  doc.text('Access: All Users (for own assets), Asset Manager, Manager', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFont('helvetica', 'bold')
  doc.text('For Asset Managers:', margin, yPosition)
  yPosition += lineHeight

  doc.setFont('helvetica', 'normal')
  const transferSteps = [
    '1. Navigate to "Asset Transfer Request"',
    '2. Fill in the transfer details:',
    '   - Asset: Select the asset to transfer',
    '   - From Employee: Current asset holder',
    '   - To Employee: New asset holder',
    '   - Transfer Type: Employee to Employee, Department to Department, or Location to Location',
    '   - Transfer Reason: Reason for transfer',
    '   - Current Condition: Condition at time of transfer',
    '   - Handover Condition: Expected condition after transfer',
    '   - Accessories Included: List any accessories',
    '   - Remarks: Additional notes',
    '   - Effective Date: Date of transfer',
    '3. Submit the transfer request'
  ]

  transferSteps.forEach(step => {
    checkNewPage()
    const splitStep = doc.splitTextToSize(step, doc.internal.pageSize.width - margin * 2)
    splitStep.forEach((line: string) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    });
  })

  yPosition += lineHeight

  // Helpdesk System
  doc.addPage()
  yPosition = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('3. Helpdesk System', margin, yPosition)
  yPosition += lineHeight * 2

  // Tickets Workflow
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('3.1 Tickets Workflow', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Purpose: Track and resolve support requests, issues, and incidents.', margin, yPosition)
  yPosition += lineHeight
  doc.text('Access: All Users (submit), Support Agents, Admin (resolve)', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFont('helvetica', 'bold')
  doc.text('Creating a Ticket:', margin, yPosition)
  yPosition += lineHeight

  doc.setFont('helvetica', 'normal')
  const ticketSteps = [
    '1. Navigate to "Helpdesk" or "Support"',
    '2. Click "New Ticket" or "Submit Ticket"',
    '3. Fill in ticket details:',
    '   - Subject: Brief description of the issue',
    '   - Category: Hardware, Software, Network, Asset, Other',
    '   - Priority: Low, Medium, High, Critical',
    '   - Description: Detailed explanation',
    '   - Attachments: Screenshots, error logs',
    '   - Location: Physical location if applicable',
    '4. Submit the ticket'
  ]

  ticketSteps.forEach(step => {
    checkNewPage()
    const splitStep = doc.splitTextToSize(step, doc.internal.pageSize.width - margin * 2)
    splitStep.forEach((line: string) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
  })

  yPosition += lineHeight

  // Knowledge Base
  doc.addPage()
  yPosition = margin

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('3.2 Knowledge Base', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('Purpose: Central repository of articles, guides, and solutions to common issues.', margin, yPosition)
  yPosition += lineHeight
  doc.text('Access: All Users (view), Support Agents, Admin (create/edit)', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFont('helvetica', 'bold')
  doc.text('Using the Knowledge Base:', margin, yPosition)
  yPosition += lineHeight

  doc.setFont('helvetica', 'normal')
  const kbSteps = [
    '1. Navigate to "Knowledge Base" from the Helpdesk section',
    '2. Use the search bar to find articles',
    '3. Browse by category:',
    '   - Hardware',
    '   - Software',
    '   - Network',
    '   - Asset Management',
    '   - Policies & Procedures',
    '   - FAQs',
    '4. Click on an article to view full content',
    '5. Rate articles for helpfulness',
    '6. Suggest improvements or new articles'
  ]

  kbSteps.forEach(step => {
    checkNewPage()
    const splitStep = doc.splitTextToSize(step, doc.internal.pageSize.width - margin * 2)
    splitStep.forEach((line: string) => {
      doc.text(line, margin, yPosition)
      yPosition += lineHeight
    })
  })

  // User Roles
  doc.addPage()
  yPosition = margin

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('4. User Roles and Permissions', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')

  const roles = [
    { role: 'Admin', permissions: 'Full system access, User management, Role assignment, System configuration' },
    { role: 'General Director', permissions: 'Executive dashboards, Strategic reports, Approval authority, View all assets' },
    { role: 'Manager', permissions: 'Department-level management, Approve requests, View department assets' },
    { role: 'Department Head', permissions: 'Approve department requests, Manage department assets' },
    { role: 'Asset Officer', permissions: 'Register assets, Manage inventory, Process transfers, Conduct inspections' },
    { role: 'Asset Manager', permissions: 'All asset officer permissions, Approve transfers, Manage lifecycle' },
    { role: 'IT Officer', permissions: 'IT asset management, Software licensing, Network equipment, Technical support' },
    { role: 'Support Agent', permissions: 'Handle tickets, Create knowledge base articles, Provide support' },
    { role: 'Regular User', permissions: 'View own assets, Submit requests, Submit tickets, View knowledge base' }
  ]

  const tableData = roles.map(r => [r.role, r.permissions])

  autoTable(doc, {
    startY: yPosition,
    head: [['Role', 'Permissions']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 10, cellPadding: 3 }
  })

  // Getting Started
  yPosition = (doc as any).lastAutoTable.finalY + 20
  checkNewPage(30)

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('5. Getting Started', margin, yPosition)
  yPosition += lineHeight * 2

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text('First-Time Login:', margin, yPosition)
  yPosition += lineHeight

  const loginSteps = [
    '1. Open the application URL',
    '2. Enter your username and password',
    '3. Click "Login"',
    '4. Complete your profile if required',
    '5. Review your dashboard'
  ]

  loginSteps.forEach(step => {
    checkNewPage()
    doc.text(step, margin, yPosition)
    yPosition += lineHeight
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${pageCount} | Digital CSC Asset Management System User Manual v1.0`,
      margin,
      pageHeight - 10
    )
  }

  // Save the PDF
  doc.save('Digital_CSC_User_Manual.pdf')
}
