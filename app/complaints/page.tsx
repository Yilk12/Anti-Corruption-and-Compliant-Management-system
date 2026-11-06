"use client"

import { useEffect, useMemo, useRef, useState } from "react";
import { decodeJwt } from "@/app/lib/auth";

type ComplaintCategory =
  | "staff_misconduct"
  | "abuse_of_authority"
  | "workplace_harassment"
  | "administrative_delay"
  | "policy_violation"
  | "fraud_corruption"
  | "facilities_environment"
  | "other";

const CATEGORY_OPTIONS: { value: ComplaintCategory; label: string }[] = [
  { value: "staff_misconduct", label: "Staff Misconduct" },
  { value: "abuse_of_authority", label: "Abuse of Authority" },
  { value: "workplace_harassment", label: "Workplace Harassment" },
  { value: "administrative_delay", label: "Administrative Delay" },
  { value: "policy_violation", label: "Policy Violation" },
  { value: "fraud_corruption", label: "Fraud / Corruption" },
  { value: "facilities_environment", label: "Facilities / Workplace Environment" },
  { value: "other", label: "Other" },
];

export default function ComplaintsPage() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
  const jwt = useMemo(() => { try { return token ? decodeJwt(token) : null } catch { return null } }, [token]);
  const roles = useMemo(() => {
    const rr: string[] = [];
    try {
      const p: any = jwt || {};
      if (typeof p?.role === 'string') rr.push(p.role);
      if (Array.isArray(p?.role)) rr.push(...p.role);
      if (Array.isArray(p?.roles)) rr.push(...p.roles);
      if (p?.realm_access?.roles) rr.push(...p.realm_access.roles);
      if (p?.resource_access) { for (const v of Object.values(p.resource_access||{})) { const rrs = (v as any)?.roles; if (Array.isArray(rrs)) rr.push(...rrs) } }
    } catch {}
    return rr.map(String).map(r=>r.toUpperCase());
  }, [jwt]);


  const isDirector = roles.some(r=>/(GENERAL_DIRECTOR|DIRECTOR|ADMIN|SUPERUSER)/.test(r));
  const isDeptHead = roles.some(r=>/(DEPARTMENT_HEAD|DEPT_HEAD)/.test(r));
  const isEmployee = roles.some(r=>/(EMPLOYEE|STAFF)/.test(r));

  // Form state
  const [fullName, setFullName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [position, setPosition] = useState("");
  const [officeOrDepartment, setOfficeOrDepartment] = useState("");
  const [roleDeclared, setRoleDeclared] = useState<'EMPLOYEE'|'DEPARTMENT_HEAD'|'GENERAL_DIRECTOR'>("EMPLOYEE");

  const [category, setCategory] = useState<ComplaintCategory>("staff_misconduct");
  const [categoryOtherText, setCategoryOtherText] = useState("");

  const [subject, setSubject] = useState("");
  const [incidentAt, setIncidentAt] = useState("");
  const [location, setLocation] = useState("");
  const [personsInvolved, setPersonsInvolved] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [desiredAction, setDesiredAction] = useState("");

  const [confidential, setConfidential] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [declaration, setDeclaration] = useState(false);
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<{ref:string} | null>(null);

  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!receiptRef.current) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Complaint Receipt</title></head><body>${receiptRef.current.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setError(""); setConfirmation(null);
    try {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['authorization'] = `Bearer ${token}`;
      const body = {
        fullName: anonymous ? undefined : fullName,
        employeeId: anonymous ? undefined : employeeId,
        position: anonymous ? undefined : position,
        officeOrDepartment: anonymous ? undefined : officeOrDepartment,
        roleDeclared,
        category,
        categoryOtherText: category === 'other' ? categoryOtherText : undefined,
        subject,
        incidentAt: incidentAt || undefined,
        location: location || undefined,
        personsInvolved: personsInvolved || undefined,
        description,
        impact: impact || undefined,
        desiredAction: desiredAction || undefined,
        confidential,
        anonymous,
        declaration,
        consent,
        createdBySub: jwt?.sub,
        department: officeOrDepartment,
      };
      const r = await fetch('/api/complaints', { method: 'POST', headers, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Failed to submit');
      setConfirmation({ ref: d?.item?.ref });
      // Clear minimal
      setSubject(""); setDescription(""); setDesiredAction(""); setImpact("");
    } catch (e:any) {
      setError(e?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Role-based listing & filters
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  const loadList = async () => {
    if (!(isDirector || isDeptHead || isEmployee)) return;
    setLoading(true);
    try {
      const headers: Record<string,string> = {};
      if (token) headers['authorization'] = `Bearer ${token}`;
      const qs = new URLSearchParams();
      if (statusFilter) qs.set('status', statusFilter);
      if (categoryFilter) qs.set('category', categoryFilter);
      const r = await fetch(`/api/complaints${qs.toString() ? `?${qs.toString()}` : ''}`, { headers });
      const d = await r.json();
      setList(Array.isArray(d?.items) ? d.items : []);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(); /* eslint-disable-next-line */ }, [statusFilter, categoryFilter]);

  const exportCsv = () => {
    const rows = [
      ["Ref","Subject","Category","Status","Department","Created","Submitter"],
      ...list.map(it=>[
        it.ref,
        it.subject,
        it.category,
        it.status,
        it.department || '',
        it.createdAt,
        it.fullName || 'Anonymous',
      ])
    ];
    const csv = rows.map(r=>r.map(v=>`"${String(v||'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'complaints.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Complaints Submission</h1>
        <div className="text-sm text-gray-600">Structured, secure, and confidential reporting for CSC employees.</div>
      </div>

      {/* Confirmation */}
      {confirmation && (
        <div className="border rounded p-3 bg-green-50">
          <div className="font-semibold">በትክክል ተልኳል</div>
          <div>Reference Number: <span className="font-mono">{confirmation.ref}</span></div>
          <div className="mt-2 flex gap-2">
            <button className="px-3 py-2 border rounded" onClick={handlePrint}>Print Copy</button>
          </div>
          <div ref={receiptRef} className="hidden">
            <h2>Complaint Receipt</h2>
            <p>Reference: {confirmation.ref}</p>
            <p>Subject: {subject}</p>
            <p>Department: {officeOrDepartment}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* User Identification & Role */}
        <div className="space-y-3">
          <div className="font-semibold">User Identification & Role</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input className="border rounded p-2" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} disabled={anonymous} />
            <input className="border rounded p-2" placeholder="Employee ID Number" value={employeeId} onChange={e=>setEmployeeId(e.target.value)} disabled={anonymous} />
            <input className="border rounded p-2" placeholder="Position / Job Title" value={position} onChange={e=>setPosition(e.target.value)} disabled={anonymous} />
            <input className="border rounded p-2" placeholder="Office / Department" value={officeOrDepartment} onChange={e=>setOfficeOrDepartment(e.target.value)} disabled={anonymous} />
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            {(["EMPLOYEE","DEPARTMENT_HEAD","GENERAL_DIRECTOR"] as const).map(r => (
              <label key={r} className="flex items-center gap-2">
                <input type="radio" name="role" checked={roleDeclared===r} onChange={()=>setRoleDeclared(r)} />
                <span>{r.replace('_',' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Complaint Classification */}
        <div className="space-y-2">
          <div className="font-semibold">Complaint Classification</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {CATEGORY_OPTIONS.map(c => (
              <label key={c.value} className="flex items-center gap-2">
                <input type="radio" name="category" checked={category===c.value} onChange={()=>setCategory(c.value)} />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          {category === 'other' && (
            <input className="border rounded p-2 w-full" placeholder="Specify other category" value={categoryOtherText} onChange={e=>setCategoryOtherText(e.target.value)} />
          )}
        </div>

        {/* Complaint Details */}
        <div className="space-y-2">
          <div className="font-semibold">Complaint Details</div>
          <input className="border rounded p-2 w-full" placeholder="Subject / Title of Complaint" value={subject} onChange={e=>setSubject(e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="border rounded p-2" type="datetime-local" value={incidentAt} onChange={e=>setIncidentAt(e.target.value)} />
            <input className="border rounded p-2" placeholder="Location of Incident" value={location} onChange={e=>setLocation(e.target.value)} />
            <input className="border rounded p-2" placeholder="Name(s) of Person(s) Involved" value={personsInvolved} onChange={e=>setPersonsInvolved(e.target.value)} />
          </div>
          <textarea className="border rounded p-2 w-full h-32" placeholder="Detailed Description (What happened?)" value={description} onChange={e=>setDescription(e.target.value)} required />
          <textarea className="border rounded p-2 w-full h-24" placeholder="Impact or Effect" value={impact} onChange={e=>setImpact(e.target.value)} />
          <input className="border rounded p-2 w-full" placeholder="Desired Action or Resolution requested" value={desiredAction} onChange={e=>setDesiredAction(e.target.value)} />
          <div className="text-xs text-gray-600">Attachments upload not implemented in this prototype.</div>
        </div>

        {/* Confidentiality Options */}
        <div className="space-y-1">
          <div className="font-semibold">Confidentiality Options</div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={confidential} onChange={e=>setConfidential(e.target.checked)} /> <span>I want this complaint to be treated confidentially</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={anonymous} onChange={e=>setAnonymous(e.target.checked)} /> <span>I prefer to submit this complaint anonymously</span></label>
          <div className="text-xs text-gray-600">Note: Anonymous complaints may limit the investigation process.</div>
        </div>

        {/* Declaration and Consent */}
        <div className="space-y-1">
          <div className="font-semibold">Declaration and Consent</div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={declaration} onChange={e=>setDeclaration(e.target.checked)} required /> <span>I declare that the information provided is true and correct.</span></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} required /> <span>I consent to the use of my personal data for complaint investigation.</span></label>
        </div>

        {/* Submit */}
        <div className="flex gap-2 justify-end">
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-blue-600 text-white">{submitting ? 'Submitting...' : 'Submit Complaint'}</button>
        </div>
        {error && <div className="text-sm text-red-700">{error}</div>}
      </form>

      {/* Role-based list and filters for Dept Heads and Directors (and personal list for employees) */}
      {(isDirector || isDeptHead || isEmployee) && (
        <div className="space-y-3">
          <div className="font-semibold">Complaints List</div>
          <div className="flex flex-wrap gap-2 items-center">
            <select className="border rounded p-2" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="escalated">Escalated</option>
            </select>
            <select className="border rounded p-2" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(c=> (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button className="px-3 py-2 border rounded" onClick={loadList} disabled={loading}>{loading ? 'Loading...' : 'Refresh'}</button>
            {(isDirector || isDeptHead) && (
              <button className="px-3 py-2 border rounded" onClick={exportCsv}>Export CSV</button>
            )}
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2 border">Ref</th>
                  <th className="text-left p-2 border">Subject</th>
                  <th className="text-left p-2 border">Category</th>
                  <th className="text-left p-2 border">Status</th>
                  <th className="text-left p-2 border">Department</th>
                  <th className="text-left p-2 border">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="p-2 border" colSpan={6}>Loading...</td></tr>
                ) : list.length === 0 ? (
                  <tr><td className="p-2 border" colSpan={6}>No items</td></tr>
                ) : list.map(it => (
                  <tr key={it.id}>
                    <td className="p-2 border font-mono">{it.ref}</td>
                    <td className="p-2 border">{it.subject}</td>
                    <td className="p-2 border">{it.category}</td>
                    <td className="p-2 border uppercase text-xs">{it.status}</td>
                    <td className="p-2 border">{it.department || ''}</td>
                    <td className="p-2 border">{new Date(it.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-600">Acknowledgment in 3 days, initial review in 5 days, resolution update within 15 days. Escalation supported.</div>
        </div>
      )}

      {/* Compliance footnote */}
      <div className="text-xs text-gray-500">
        Aligns with Data Privacy Act (RA 10173), Anti-Red Tape Act (ARTA), and RA 6713 (CSC Code of Conduct).
      </div>
    </div>
  );
}
