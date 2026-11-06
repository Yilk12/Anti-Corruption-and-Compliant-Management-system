"use client"

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeJwt } from "@/app/lib/auth";

export default function VoiceboxSubmitPage() {
  const router = useRouter();

  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token')) : null;
  const submitter = useMemo(() => {
    try { return token ? decodeJwt(token) : null; } catch { return null; }
  }, [token]);

  const [feedbackType, setFeedbackType] = useState("complaint");
  const [identityType, setIdentityType] = useState("internal");
  const [anonymous, setAnonymous] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [officeOrUnit, setOfficeOrUnit] = useState("");
  const [address, setAddress] = useState("");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [incidentAt, setIncidentAt] = useState("");
  const [location, setLocation] = useState("");
  const [staffInvolved, setStaffInvolved] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [priority, setPriority] = useState("normal");
  const [receiver, setReceiver] = useState<'user' | 'department_head' | 'commissioner'>('user');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true); setError("");
  try {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken") ||
          localStorage.getItem("jwt") ||
          localStorage.getItem("token")
        : null;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["authorization"] = `Bearer ${token}`;

    const body = {
      type: String(feedbackType).toUpperCase(),   // COMPLAINT | SUGGESTION | COMPLIMENT
      message: subject ? `${subject}\n\n${description}` : description,
      anonymous,
      departmentId: undefined,                    // supply a UUID if you target a department
      recipientUserId: undefined,                 // supply a UUID if sending to a specific user
    };
    console.log()

    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    console.log("thisi is r",r)
    const d = await r.json().catch(() => ({}));
    console.log("thisi is d",d)
    if (!r.ok) throw new Error(d?.message || d?.error || "Failed to submit");
    router.replace("/voicebox");
  } catch (e: any) {
    setError(e?.message || "Failed");
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">አስተያየትና ጥቆማ ይስጡ</h1>

      {error && <div className="text-sm text-red-700 mb-3">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-4 max-w-3xl">
        {/* Step 1: Feedback Type */}
        <div>
          <div className="font-semibold mb-1">የግብረ መልስ አይነት</div>
          <div className="flex gap-4">
            {['complaint','suggestion','compliment'].map(t => (
              <label key={t} className="flex items-center gap-2">
                <input type="radio" name="type" checked={feedbackType===t} onChange={()=>setFeedbackType(t)} />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Step 2: Identity */}
        <div>
          <div className="font-semibold mb-1">Identify Yourself</div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="identity" checked={identityType==='internal'} onChange={()=>setIdentityType('internal')} />
              <span>Internal Customer</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="identity" checked={identityType==='external'} onChange={()=>setIdentityType('external')} />
              <span>External Customer</span>
            </label>
          </div>
        </div>

        {/* Step 3: Complainant Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={anonymous} onChange={(e)=>setAnonymous(e.target.checked)} />
              <span>I prefer to remain anonymous</span>
            </label>
          </div>
          {!anonymous && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className="border rounded p-2" placeholder="Full Name" value={fullName} onChange={e=>setFullName(e.target.value)} />
              <input className="border rounded p-2" placeholder="Contact (Email / Phone)" value={contact} onChange={e=>setContact(e.target.value)} />
              {identityType==='internal' ? (
                <input className="border rounded p-2" placeholder="Office / Unit" value={officeOrUnit} onChange={e=>setOfficeOrUnit(e.target.value)} />
              ) : (
                <input className="border rounded p-2" placeholder="Address" value={address} onChange={e=>setAddress(e.target.value)} />
              )}
            </div>
          )}
        </div>

        {/* Step 4: Details */}
        <div className="space-y-2">
          <input className="border rounded p-2 w-full" placeholder="Subject / Title" value={subject} onChange={e=>setSubject(e.target.value)} required />
          <textarea className="border rounded p-2 w-full h-40" placeholder="Detailed Description" value={description} onChange={e=>setDescription(e.target.value)} required />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="border rounded p-2" type="datetime-local" value={incidentAt} onChange={e=>setIncidentAt(e.target.value)} />
            <input className="border rounded p-2" placeholder="Location / Office Involved" value={location} onChange={e=>setLocation(e.target.value)} />
            <input className="border rounded p-2" placeholder="Staff Involved (if any)" value={staffInvolved} onChange={e=>setStaffInvolved(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input className="border rounded p-2" placeholder="Desired Action" value={desiredAction} onChange={e=>setDesiredAction(e.target.value)} />
            <select className="border rounded p-2" value={priority} onChange={e=>setPriority(e.target.value)}>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>
            <select className="border rounded p-2" value={receiver} onChange={e=>setReceiver(e.target.value as any)}>
              <option value="user">User</option>
              <option value="department_head">Department Head</option>
              <option value="commissioner">Commissioner</option>
            </select>
          </div>
        </div>

        {/* Step 5: Attachments - placeholder only */}
        <div className="text-xs text-gray-600">Attachment upload is not persisted in this prototype.</div>

        <div className="flex gap-2 justify-end">
          <button type="button" className="px-3 py-2 border rounded" onClick={()=>router.back()}>Cancel</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-blue-600 text-white">{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}
