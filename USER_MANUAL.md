# Digital CSC - Asset Management System User Manual

## Table of Contents

1. [Introduction](#introduction)
2. [Asset Management System](#asset-management-system)
   - [Asset Registration](#asset-registration)
   - [Asset Request](#asset-request)
   - [Asset Transfer](#asset-transfer)
   - [Asset Return](#asset-return)
   - [Asset Stock Card](#asset-stock-card)
   - [Asset Bin Card](#asset-bin-card)
   - [Request Workflow](#request-workflow)
   - [Asset Inspection](#asset-inspection)
   - [Vehicle Inspection](#vehicle-inspection)
   - [Maintenance Request](#maintenance-request)
   - [Asset Disposal](#asset-disposal)
3. [Helpdesk System](#helpdesk-system)
   - [Tickets Workflow](#tickets-workflow)
   - [Knowledge Base](#knowledge-base)
4. [User Roles and Permissions](#user-roles-and-permissions)
5. [Getting Started](#getting-started)
6. [Troubleshooting](#troubleshooting)

---

## Introduction

The Digital CSC Asset Management System is a comprehensive platform designed to manage organizational assets efficiently. This manual provides step-by-step instructions for using all features of the system, including asset management, helpdesk operations, and reporting tools.

---

## Asset Management System

### Asset Registration

**Purpose:** Register new assets into the system for tracking and management.

**Access:** Admin, Manager, Department Head, Asset Officer

**Steps:**
1. Navigate to the sidebar and click "Register Asset" (የንብረት ምዝግብ)
2. Fill in the required asset information:
   - **Asset Tag:** Unique identifier for the asset
   - **Asset Name:** Descriptive name of the asset
   - **Category:** Select appropriate category (e.g., IT Equipment, Furniture, Vehicles)
   - **Serial Number:** Manufacturer serial number (if applicable)
   - **Purchase Date:** Date of acquisition
   - **Purchase Cost:** Cost of the asset
   - **Location:** Physical location of the asset
   - **Department:** Department responsible for the asset
   - **Condition:** Current condition (Excellent, Good, Fair, Poor, Damaged)
   - **Description:** Additional details about the asset
3. Upload supporting documents (receipts, warranties) if available
4. Click "Save" or "Register" to complete the registration

**Notes:**
- Asset tags must be unique within the system
- Required fields are marked with an asterisk (*)
- Assets can be edited later if information changes

---

### Asset Request

**Purpose:** Request new assets or additional equipment for departmental use.

**Access:** All Users

**Steps:**
1. Navigate to "Asset Requests" (የንብረት ጥያቄዎች) from the sidebar
2. Click "New Request" (አዲስ ጥያቄ)
3. Fill in the request details:
   - **Asset Type:** Category of asset needed
   - **Quantity:** Number of assets required
   - **Justification:** Reason for the request
   - **Priority:** Urgency level (Low, Medium, High)
   - **Required Date:** Date by which asset is needed
4. Submit the request for approval

**Workflow:**
- Request → Department Head Approval → Asset Officer Review → Manager Approval → Procurement

**Status Tracking:**
- **Pending:** Awaiting approval
- **Approved:** Request approved and being processed
- **Rejected:** Request denied
- **Fulfilled:** Asset has been provided

---

### Asset Transfer

**Purpose:** Transfer assets between employees, departments, or locations.

**Access:** All Users (for own assets), Asset Manager, Manager

**Steps:**

#### For Asset Managers:
1. Navigate to "የንብረት ማስተላለፊያ ጥያቄ" (Asset Transfer Request)
2. Fill in the transfer details:
   - **Asset:** Select the asset to transfer
   - **From Employee:** Current asset holder
   - **To Employee:** New asset holder
   - **Transfer Type:** Employee to Employee, Department to Department, or Location to Location
   - **Transfer Reason:** Reason for transfer (Reassignment, Department Change, etc.)
   - **Current Condition:** Condition at time of transfer
   - **Handover Condition:** Expected condition after transfer
   - **Accessories Included:** List any accessories being transferred
   - **Remarks:** Additional notes
   - **Effective Date:** Date of transfer
3. Submit the transfer request

#### For Regular Users:
1. Navigate to "My Assets" (የኔ ንብረቶች)
2. Select the asset to transfer
3. Click "Transfer" and fill in the recipient details
4. Submit for approval

**Workflow:**
- Transfer Request → Asset Officer Review → Manager Approval → Receiver Confirmation → Transfer Complete

**Status Tracking:**
- **TRANSFER_REQUESTED:** Request submitted
- **PENDING_MANAGER_APPROVAL:** Awaiting manager approval
- **PENDING_DEPARTMENT_APPROVAL:** Awaiting department approval
- **WAITING_RECEIVER:** Waiting for receiver to accept
- **RECEIVER_ACCEPTED:** Receiver has accepted
- **COMPLETED:** Transfer complete

---

### Asset Return

**Purpose:** Return assets when no longer needed or when leaving the organization.

**Access:** All Users

**Steps:**
1. Navigate to "My Assets" (የኔ ንብረቶች)
2. Select the asset to return
3. Click "Return Asset" (ንብረት መመለስ)
4. Fill in return details:
   - **Return Date:** Date of return
   - **Return Condition:** Current condition of the asset
   - **Reason:** Reason for return
   - **Accessories Returned:** List all accessories included
   - **Remarks:** Additional notes
5. Submit the return request

**Workflow:**
- Return Request → Asset Officer Inspection → Asset Officer Approval → Asset Returned to Stock

---

### Asset Stock Card

**Purpose:** Track the movement and history of individual assets over time.

**Access:** Asset Officer, Asset Manager, Admin, Manager

**Steps:**
1. Navigate to the asset list
2. Click on an asset to view details
3. Select "Stock Card" from the options
4. View the complete history including:
   - Registration date
   - All transfers (who, when, where)
   - Maintenance records
   - Inspections
   - Current location and holder
   - Condition changes

**Information Displayed:**
- Transaction date
- Transaction type (Registration, Transfer, Return, Maintenance)
- From/To location or person
- Quantity
- Balance
- Remarks

---

### Asset Bin Card

**Purpose:** Track inventory levels for consumable assets or items with multiple units.

**Access:** Asset Officer, Asset Manager, Admin, Manager

**Steps:**
1. Navigate to "Assets" dashboard
2. Filter by category or search for the asset
3. Click "Bin Card" on the asset
4. View inventory movements:
   - Opening balance
   - Receipts (incoming stock)
   - Issues (outgoing stock)
   - Closing balance
   - Reorder level alerts

**Features:**
- Automatic stock level tracking
- Low stock alerts
- Reorder point management
- Transaction history

---

### Request Workflow

**General Workflow for All Requests:**

1. **Submission**
   - User submits request with required details
   - System assigns unique request ID
   - Request status set to "Pending"

2. **Department Head Approval**
   - Department Head reviews request
   - Approves or rejects based on department needs
   - Comments can be added for justification

3. **Asset Officer Review**
   - Asset Officer checks availability
   - Verifies asset condition if applicable
   - Recommends approval or rejection

4. **Manager Approval**
   - Manager reviews final recommendation
   - Approves procurement or transfer
   - Authorizes budget if required

5. **Processing**
   - Approved requests are processed
   - Assets are allocated or procured
   - User is notified of completion

6. **Fulfillment**
   - Asset is delivered to requester
   - Receipt is confirmed
   - Request marked as "Fulfilled"

**Status Notifications:**
- Email notifications at each stage
- Dashboard updates in real-time
- SMS alerts for urgent requests (if enabled)

---

### Asset Inspection

**Purpose:** Regular inspection of assets to ensure proper condition and maintenance.

**Access:** Asset Officer, Asset Manager

**Steps:**
1. Navigate to "Asset Inspection" from the dashboard
2. Select the asset to inspect
3. Fill in inspection details:
   - **Inspection Date:** Date of inspection
   - **Inspector Name:** Name of the person conducting inspection
   - **Overall Condition:** Current condition rating
   - **Physical Condition:** Notes on physical state
   - **Functional Status:** Working or not working
   - **Issues Found:** List any problems discovered
   - **Maintenance Required:** If maintenance is needed
   - **Recommendations:** Suggestions for repair or replacement
4. Attach photos if applicable
5. Submit inspection report

**Inspection Types:**
- Routine Inspection: Scheduled regular checks
- Pre-Transfer Inspection: Before asset transfer
- Post-Maintenance Inspection: After repair work
- Annual Inspection: Comprehensive yearly review

---

### Vehicle Inspection

**Purpose:** Specialized inspection for vehicles to ensure safety and compliance.

**Access:** Asset Officer, Asset Manager, Fleet Manager

**Steps:**
1. Navigate to "Vehicle Inspection" section
2. Select the vehicle to inspect
3. Complete inspection checklist:
   - **Engine Performance:** Engine condition, oil levels, coolant
   - **Brake System:** Brake pads, fluid levels, response time
   - **Tires:** Tread depth, pressure, condition
   - **Lights:** Headlights, brake lights, indicators
   - **Safety Equipment:** Seatbelts, airbags, fire extinguisher
   - **Documentation:** Registration, insurance, inspection sticker
   - **Body Condition:** Dents, scratches, rust
   - **Interior:** Cleanliness, seat condition, dashboard
4. Record mileage
5. Note any defects or issues
6. Set next inspection date
7. Submit inspection report

**Required Inspections:**
- Pre-trip inspection (before each use)
- Monthly routine inspection
- Annual comprehensive inspection
- Post-accident inspection (if applicable)

---

### Maintenance Request

**Purpose:** Request maintenance or repair for assets that need service.

**Access:** All Users

**Steps:**
1. Navigate to "Maintenance Request" from the dashboard
2. Click "New Maintenance Request"
3. Fill in maintenance details:
   - **Asset:** Select the asset needing maintenance
   - **Issue Type:** Repair, Service, Calibration, Upgrade
   - **Description:** Detailed description of the problem
   - **Priority:** Urgency level (Low, Medium, High, Critical)
   - **Preferred Date:** When maintenance should be performed
   - **Location:** Where the asset is located
4. Submit the request

**Workflow:**
- Request → Asset Officer Review → Vendor Assignment → Maintenance Performed → Inspection → Completion

**Status Tracking:**
- **Pending:** Awaiting review
- **Approved:** Maintenance approved
- **In Progress:** Maintenance being performed
- **Completed:** Maintenance finished
- **Cancelled:** Request cancelled

---

### Asset Disposal

**Purpose:** Properly dispose of assets that are no longer useful, damaged beyond repair, or obsolete.

**Access:** Asset Manager, Admin

**Steps:**
1. Navigate to "Asset Disposal" section
2. Select the asset to dispose
3. Fill in disposal details:
   - **Disposal Reason:** Obsolete, Damaged, End of Life, Surplus
   - **Current Condition:** Condition at time of disposal
   - **Disposal Method:** Sell, Donate, Scrap, Recycle
   - **Estimated Value:** Current residual value (if any)
   - **Approval Required:** Manager/Director approval
4. Attach supporting documents (photos, valuation reports)
5. Submit for approval

**Workflow:**
- Disposal Request → Asset Manager Review → Director Approval → Disposal Execution → Record Update

**Disposal Methods:**
- **Sale:** Sell to external party
- **Donate:** Donate to charity or other organization
- **Scrap:** Break down for parts
- **Recycle:** Environmentally friendly recycling
- **Auction:** Public auction for valuable items

**Compliance:**
- Follow organizational disposal policies
- Maintain disposal records for audit
- Obtain necessary approvals
- Document environmental impact

---

## Helpdesk System

### Tickets Workflow

**Purpose:** Track and resolve support requests, issues, and incidents.

**Access:** All Users (submit), Support Agents, Admin (resolve)

**Steps:**

#### Creating a Ticket:
1. Navigate to "Helpdesk" or "Support"
2. Click "New Ticket" or "Submit Ticket"
3. Fill in ticket details:
   - **Subject:** Brief description of the issue
   - **Category:** Hardware, Software, Network, Asset, Other
   - **Priority:** Low, Medium, High, Critical
   - **Description:** Detailed explanation of the problem
   - **Attachments:** Screenshots, error logs, photos
   - **Location:** Physical location if applicable
4. Submit the ticket

#### Ticket Workflow:
1. **Submission**
   - User submits ticket
   - System assigns ticket ID
   - Auto-acknowledgment sent to user

2. **Triage**
   - Support agent reviews ticket
   - Assigns priority and category
   - Routes to appropriate team

3. **Assignment**
   - Ticket assigned to specific agent
   - Agent acknowledges receipt
   - Estimated resolution time provided

4. **Investigation**
   - Agent investigates the issue
   - May request additional information
   - User communicates with agent

5. **Resolution**
   - Agent implements solution
   - Tests the fix
   - Documents the resolution

6. **Verification**
   - User verifies the fix
   - Confirms issue is resolved
   - Provides feedback

7. **Closure**
   - Ticket marked as resolved
   - Closed in the system
   - Satisfaction survey sent (optional)

**Ticket Status:**
- **Open:** New ticket submitted
- **In Progress:** Being worked on
- **Pending:** Waiting for user response or external action
- **Resolved:** Issue fixed, awaiting user confirmation
- **Closed:** Ticket completed and verified
- **Reopened:** Issue persists after resolution

**Priority Levels:**
- **Critical:** System down, complete work stoppage (response: < 1 hour)
- **High:** Major impact on work (response: < 4 hours)
- **Medium:** Partial impact (response: < 24 hours)
- **Low:** Minor issue (response: < 48 hours)

---

### Knowledge Base

**Purpose:** Central repository of articles, guides, and solutions to common issues.

**Access:** All Users (view), Support Agents, Admin (create/edit)

**Steps:**

#### Using the Knowledge Base:
1. Navigate to "Knowledge Base" from the Helpdesk section
2. Use the search bar to find articles
3. Browse by category:
   - Hardware
   - Software
   - Network
   - Asset Management
   - Policies & Procedures
   - FAQs
4. Click on an article to view full content
5. Rate articles for helpfulness
6. Suggest improvements or new articles

#### Creating Knowledge Base Articles (Support Agents/Admin):
1. Navigate to Knowledge Base
2. Click "New Article"
3. Fill in article details:
   - **Title:** Clear, descriptive title
   - **Category:** Appropriate category
   - **Tags:** Keywords for search
   - **Content:** Step-by-step instructions or information
   - **Attachments:** Screenshots, diagrams, documents
   - **Related Articles:** Link to related content
4. Save as draft or publish

**Article Types:**
- **How-to Guides:** Step-by-step instructions
- **Troubleshooting:** Common issues and solutions
- **FAQs:** Frequently asked questions
- **Policies:** Organizational policies and procedures
- **Best Practices:** Recommended ways of doing things
- **Video Tutorials:** Embedded video content

**Features:**
- Full-text search
- Category browsing
- Article ratings
- Version history
- Print-friendly format
- Share via email

---

## User Roles and Permissions

### Admin
- Full system access
- User management
- Role assignment
- System configuration
- All asset operations
- All helpdesk operations

### General Director
- Executive dashboards
- Strategic reports
- Approval authority
- View all assets
- View all tickets

### Manager
- Department-level management
- Approve requests within department
- View department assets
- Assign tasks to team
- View department tickets

### Department Head
- Approve department requests
- Manage department assets
- View department reports
- Submit requests

### Asset Officer
- Register assets
- Manage asset inventory
- Process transfers
- Conduct inspections
- Manage maintenance
- Process disposals

### Asset Manager
- All asset officer permissions
- Approve asset transfers
- Manage asset lifecycle
- Generate reports
- Supervise asset officers

### IT Officer
- IT asset management
- Software licensing
- Network equipment
- Technical support
- IT-related tickets

### Support Agent
- Handle helpdesk tickets
- Create knowledge base articles
- Provide technical support
- Track ticket resolution

### Regular User
- View own assets
- Submit asset requests
- Submit transfer requests
- Submit maintenance requests
- Submit helpdesk tickets
- View knowledge base

---

## Getting Started

### First-Time Login
1. Open the application URL
2. Enter your username and password
3. Click "Login"
4. Complete your profile if required
5. Review your dashboard

### Dashboard Overview
The main dashboard provides:
- Quick statistics (total assets, pending requests, open tickets)
- Recent activities
- Quick action buttons
- Notifications
- Role-specific widgets

### Navigation
- Use the sidebar to navigate between modules
- Use breadcrumbs for easy navigation back
- Use search to find specific items
- Bookmark frequently used pages

---

## Troubleshooting

### Common Issues

**Issue: Cannot submit asset request**
- Solution: Ensure all required fields are filled
- Check if you have the required permissions
- Contact your manager if approval is needed

**Issue: Asset not showing in list**
- Solution: Check if asset is registered
- Verify your search filters
- Contact Asset Officer

**Issue: Transfer request stuck in pending**
- Solution: Check with your manager for approval status
- Contact Asset Officer for review

**Issue: Cannot access helpdesk**
- Solution: Verify your role permissions
- Contact system administrator

**Issue: Knowledge base search not working**
- Solution: Clear browser cache
- Try different keywords
- Use category browsing

### Getting Help
- Submit a helpdesk ticket for technical issues
- Contact the IT department directly for urgent matters
- Check the knowledge base for common solutions
- Refer to this manual for guidance

---

## Contact Information

**IT Support:** [Contact details]
**Asset Management Office:** [Contact details]
**System Administrator:** [Contact details]

---

*Document Version: 1.0*
*Last Updated: October 2026*
