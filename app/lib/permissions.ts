export type PermissionActivity = {
  key: string
  label: string
}

export type PermissionModule = {
  key: string
  label: string
  activities: PermissionActivity[]
}

// Central permissions catalogue for all modules and activities
export const PERMISSION_MODULES: PermissionModule[] = [
  {
    key: "users",
    label: "Users",
    activities: [
      { key: "view", label: "View" },
      { key: "invite", label: "Invite" },
      { key: "update", label: "Update" },
      { key: "disable", label: "Disable" },
      { key: "delete", label: "Delete" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    activities: [
      { key: "view", label: "View" },
      { key: "export", label: "Export" },
    ],
  },
  {
    key: "ethics",
    label: "Feedback and Complaint Management",
    activities: [
      { key: "view_dashboard", label: "View Dashboard" },
      { key: "view_complaints", label: "View Complaints" },
      { key: "create_complaints", label: "Create Complaints" },
      { key: "screen_complaints", label: "Screen Complaints" },
      { key: "assess_complaints", label: "Assess Complaints" },
      { key: "approve_investigation_route", label: "Approve Investigation Route" },
      { key: "assign_investigator", label: "Assign Investigator" },
      { key: "view_investigations", label: "View Investigations" },
      { key: "create_investigations", label: "Create Investigations" },
      { key: "submit_investigation_report", label: "Submit Investigation Report" },
      { key: "review_investigation_report", label: "Review Investigation Report" },
      { key: "approve_decision", label: "Approve Decision" },
      { key: "close_case", label: "Close Case" },
      { key: "view_policies", label: "View Policies" },
      { key: "create_policies", label: "Create Policies" },
      { key: "manage_policies", label: "Manage Policies" },
      { key: "view_declarations", label: "View Declarations" },
      { key: "create_declarations", label: "Create Declarations" },
      { key: "review_declarations", label: "Review Declarations" },
      { key: "view_reports", label: "View Reports" },
      { key: "send_messages", label: "Send Messages" },
    ],
  },
]
