export default function DocumentsPage() {
  return (
    <main style={{ padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Document Management</h1>
      <p style={{ color: '#4b5563', marginBottom: 16 }}>
        This is a placeholder for the Digital Record Management System (DRMS).
      </p>
      <ul style={{ lineHeight: 1.8 }}>
        <li>Upload, download, and version documents</li>
        <li>Tagging, metadata, and categories</li>
        <li>RBAC with Admin, Editor, and Viewer roles</li>
        <li>Sharing, comments, reminders, and notifications</li>
        <li>OCR and advanced search</li>
        <li>Audit trails, retention and expiry policies</li>
      </ul>
    </main>
  );
}
