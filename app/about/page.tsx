"use client";

import React from "react";

export default function AboutPage() {
  return (
    <div style={{ width: "100%", padding: 16 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <img
            src="/gallery/csc.jpg"
            alt="Federal Civil Service Commission"
            width={84}
            height={84}
            style={{ borderRadius: 12, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
          />
          <div>
            <h1 style={{ margin: 0, color: "#1f2937", fontWeight: 900, fontSize: "1.35rem" }}>
              Federal Civil Service Commission (Ethiopia)
            </h1>
            <p style={{ margin: "6px 0 0 0", color: "#374151" }}>
              An autonomous public institution of the Federal Government of Ethiopia.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          {/* Overview */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Overview</h2>
            <p style={{ color: "#374151", lineHeight: 1.65 }}>
              The Federal Civil Service Commission (also called the Federal Civil Service Commission, Ethiopia) is an
              autonomous public institution of the Federal Government of Ethiopia.
            </p>
            <p style={{ color: "#374151", lineHeight: 1.65 }}>
              Established under Proclamation No. 8/1995 (the Federal Civil Service Commission Establishment
              Proclamation) on August 24, 1900. Headquarters: Addis Ababa.
            </p>
          </section>

          {/* Legal Basis & Regulation */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Legal Basis & Regulation</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
              <li>
                Proclamation No. 8/1995: Establishes the Commission, grants autonomy, and sets objectives, powers, and
                duties.
              </li>
              <li>
                Definition of Powers and Duties of Executive Organs Proclamation No. 1263/2021: Recognizes the
                Commission as an autonomous federal government organ with its own legal personality.
              </li>
              <li>
                Council of Ministers Regulation No. 502/2022: Further defines its organization, powers, and duties.
              </li>
              <li>
                Federal Civil Servants Proclamation No. 1064/2017: Governs civil servants’ employment status, rights,
                and obligations.
              </li>
            </ul>
          </section>

          {/* Mandate, Powers, and Functions */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Mandate, Powers, and Functions</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <h3 style={{ margin: "6px 0", color: "#1f2937", fontSize: ".95rem" }}>Policy & Regulatory Development</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
                  <li>Prepare civil service policies and laws and follow up their implementation.</li>
                  <li>Issue general criteria on education, work experience, etc. for civil service positions.</li>
                </ul>
              </div>
              <div>
                <h3 style={{ margin: "6px 0", color: "#1f2937", fontSize: ".95rem" }}>Human Resources Management</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
                  <li>Oversee recruitment, placement, promotion, transfer, training, and discipline of federal civil servants.</li>
                  <li>Decide on requests to extend service beyond retirement age.</li>
                </ul>
              </div>
              <div>
                <h3 style={{ margin: "6px 0", color: "#1f2937", fontSize: ".95rem" }}>Appeals and Grievances</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
                  <li>Make final decisions on specific employee appeals in accordance with legislation.</li>
                </ul>
              </div>
              <div>
                <h3 style={{ margin: "6px 0", color: "#1f2937", fontSize: ".95rem" }}>Ensuring Efficiency, Merit & Performance</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
                  <li>Promote merit-based employment and shield civil service from undue political influence.</li>
                  <li>Ensure productivity, professionalism, and permanency of civil service.</li>
                </ul>
              </div>
              <div>
                <h3 style={{ margin: "6px 0", color: "#1f2937", fontSize: ".95rem" }}>Regulatory Oversight</h3>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
                  <li>Ensure compliance with laws and directives (discipline, performance evaluation, job requirements).</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Structure & Organization */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Structure & Organization</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
              <li>The Commission is autonomous but accountable to the Council of Ministers.</li>
              <li>Includes Commissioner/Chief Commissioner, Deputy Commissioners, and specialized units/divisions.</li>
              <li>Administrative Tribunal (Federal Civil Servants Administrative Tribunal) handles grievances under the Commission.</li>
            </ul>
          </section>

          {/* Civil Servants & Coverage */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Civil Servants & Coverage</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
              <li>Governs permanent employees of federal government institutions.</li>
              <li>Some categories (e.g., high-level officials, judiciary, police, national defense) have separate laws.</li>
            </ul>
          </section>

          {/* Recent Developments */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Recent Developments</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
              <li>Salary increment announced August 2025: minimum salary raised and higher-end scale increases.</li>
              <li>Nov 2024: House of Peoples’ Representatives endorsed a new Federal Civil Servants Proclamation draft.</li>
            </ul>
          </section>

          {/* Challenges & Issues */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Challenges & Issues</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
              <li>Implementation gaps in enforcement and compliance.</li>
              <li>Ensuring neutrality and preventing political interference.</li>
              <li>Diversity and inclusion across underrepresented groups.</li>
              <li>Compensation pressures addressed via recent salary revisions.</li>
            </ul>
          </section>

          {/* Key Directives & Guidelines */}
          <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h2 style={{ marginTop: 0, color: "#111827", fontSize: "1.1rem" }}>Key Directives & Guidelines</h2>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#374151", lineHeight: 1.65 }}>
              <li>Directive for Cost of Living Compensation / Wage Adjustment (Directive No. 1029/2017)</li>
              <li>Guideline for annual service-day recognition (Directive No. 973/2015)</li>
              <li>Guidelines on Complaint and Appeal Handling (Directive No. 781/2013)</li>
              <li>Implementation guidelines for daily allowances and on-job injury medical expense.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
