'use client'

import { generateUserManualPDF } from '@/lib/pdf-generator'
import { Download, BookOpen, FileText } from 'lucide-react'

export default function UserManualPage() {
  const handleDownloadPDF = () => {
    try {
      generateUserManualPDF()
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Error generating PDF. Please try again.')
    }
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' }}>
          User Manual
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '24px' }}>
          Comprehensive guide for the Digital CSC Asset Management System and Helpdesk
        </p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ 
              background: '#dbeafe', 
              borderRadius: '8px', 
              padding: '12px',
              marginRight: '16px'
            }}>
              <FileText size={24} color="#2563eb" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              Download PDF
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            Download the complete user manual as a PDF document for offline viewing.
          </p>
          <button
            onClick={handleDownloadPDF}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            <Download size={18} />
            Download Manual (PDF)
          </button>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ 
              background: '#dcfce7', 
              borderRadius: '8px', 
              padding: '12px',
              marginRight: '16px'
            }}>
              <BookOpen size={24} color="#059669" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              View Online
            </h3>
          </div>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
            Read the user manual directly in your browser with full navigation.
          </p>
          <button
            onClick={() => window.open('/USER_MANUAL.md', '_blank')}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#047857'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#059669'}
          >
            <BookOpen size={18} />
            View Manual (Markdown)
          </button>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>
          Manual Contents
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
              Asset Management System
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Asset Registration',
                'Asset Request',
                'Asset Transfer',
                'Asset Return',
                'Asset Stock Card',
                'Asset Bin Card',
                'Request Workflow',
                'Asset Inspection',
                'Vehicle Inspection',
                'Maintenance Request',
                'Asset Disposal'
              ].map((item, index) => (
                <li key={index} style={{ 
                  padding: '8px 12px', 
                  marginBottom: '4px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
              Helpdesk System
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {[
                'Tickets Workflow',
                'Knowledge Base',
                'User Roles and Permissions',
                'Getting Started',
                'Troubleshooting'
              ].map((item, index) => (
                <li key={index} style={{ 
                  padding: '8px 12px', 
                  marginBottom: '4px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '32px',
        padding: '16px',
        backgroundColor: '#fef3c7',
        borderRadius: '8px',
        border: '1px solid #fcd34d'
      }}>
        <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
          <strong>Note:</strong> The PDF version contains a comprehensive guide with step-by-step instructions for all features. For the most up-to-date information, refer to the online markdown version.
        </p>
      </div>
    </div>
  )
}
