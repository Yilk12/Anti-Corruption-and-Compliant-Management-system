"use client";

import React, { useEffect, useState } from "react";
import { Send, UserPlus, UserMinus, UserCheck, Users, Shield } from "lucide-react";

export default function MessageBoxPage() {
  const [mode, setMode] = React.useState<"PRIVATE" | "GROUP">("PRIVATE");
  const [department, setDepartment] = React.useState<string>("");
  const [message, setMessage] = React.useState<string>("");
  const [recipientId, setRecipientId] = React.useState<string>("");
  const [groupName, setGroupName] = React.useState<string>("");
  const [departments, setDepartments] = React.useState<Array<{ id: string; name: string }>>([
    { id: "", name: "Select department (optional)" }
  ]);
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const res = await fetch('/api/departments');
        if (res.ok) {
          const data = await res.json();
          const deptOptions = data.map((d: any) => ({
            id: d.id,
            name: d.name
          }));
          setDepartments([{ id: "", name: "Select department (optional)" }, ...deptOptions]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, []);

  const disabledSend = !message.trim() || (mode === "PRIVATE" && !recipientId.trim());

  const handleSend = async () => {
    if (disabledSend) return;
    // TODO: wire to backend (WebSocket or REST). For now just log.
    console.log("SEND", { mode, department, recipientId, message, groupName });
    setMessage("");
  };

  const handleAddFriend = async () => {
    if (!recipientId.trim()) return;
    // TODO: POST /friends
    console.log("ADD_FRIEND", { recipientId });
    alert(`Friend added (mock): ${recipientId}`);
  };

  const handleDeleteFriend = async () => {
    if (!recipientId.trim()) return;
    // TODO: DELETE /friends/:id
    console.log("DELETE_FRIEND", { recipientId });
    alert(`Friend deleted (mock): ${recipientId}`);
  };

  const handleSendFriendRequest = async () => {
    if (!recipientId.trim()) return;
    // TODO: POST /friend-requests
    console.log("SEND_FRIEND_REQUEST", { to: recipientId });
    alert(`Friend request sent (mock) to: ${recipientId}`);
  };

  return (
    <div style={{ width: "100%", maxWidth: 1000, margin: "0 auto", padding: 24, minHeight: "calc(100vh - 200px)" }}>
      <div style={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e5e5", display: "flex", alignItems: "center", gap: 12 }}>
          <Shield size={18} color="#1565c0" />
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#1565c0" }}>Message Workspace</h2>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: 16, borderBottom: "1px solid #eee", background: "#fafafa" }}>
          {/* Mode toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontWeight: 600, color: "#374151" }}>Mode:</label>
            <div style={{ display: "inline-flex", background: "#fff", border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
              <button
                onClick={() => setMode("PRIVATE")}
                style={{
                  padding: "8px 12px",
                  background: mode === "PRIVATE" ? "#1565c0" : "#fff",
                  color: mode === "PRIVATE" ? "#fff" : "#374151",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                aria-pressed={mode === "PRIVATE"}
              >
                Private
              </button>
              <button
                onClick={() => setMode("GROUP")}
                style={{
                  padding: "8px 12px",
                  background: mode === "GROUP" ? "#1565c0" : "#fff",
                  color: mode === "GROUP" ? "#fff" : "#374151",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
                aria-pressed={mode === "GROUP"}
              >
                Group
              </button>
            </div>
          </div>

          {/* Department selector */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 260 }}>
            <label htmlFor="dept" style={{ fontWeight: 600, color: "#374151" }}>Department:</label>
            <select
              id="dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={loadingDepartments}
              style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8 }}
            >
              {loadingDepartments ? (
                <option>Loading...</option>
              ) : (
                departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Recipient or Group Name */}
          {mode === "PRIVATE" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 260 }}>
              <label htmlFor="recipient" style={{ fontWeight: 600, color: "#374151" }}>Recipient ID:</label>
              <input
                id="recipient"
                placeholder="e.g., user-uuid"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, width: 240 }}
              />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 260 }}>
              <label htmlFor="groupName" style={{ fontWeight: 600, color: "#374151" }}>Group Name:</label>
              <input
                id="groupName"
                placeholder="e.g., Legal Team"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 8, width: 240 }}
              />
            </div>
          )}
        </div>

        {/* Friend actions */}
        <div style={{ display: "flex", gap: 10, padding: 16, borderBottom: "1px solid #eee" }}>
          <button onClick={handleAddFriend} title="Add friend" style={btnSecondaryStyle}> <UserPlus size={16} /> <span>Add Friend</span></button>
          <button onClick={handleDeleteFriend} title="Delete friend" style={btnSecondaryStyle}> <UserMinus size={16} /> <span>Delete Friend</span></button>
          <button onClick={handleSendFriendRequest} title="Send friend request" style={btnSecondaryStyle}> <UserCheck size={16} /> <span>Send Friend Request</span></button>
        </div>

        {/* Message area */}
        <div style={{ padding: 16 }}>
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, background: "#fff", height: 420, display: "flex", flexDirection: "column" }}>
            {/* Placeholder message list */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              <div style={{ color: "#6b7280", fontSize: 14 }}>Messages will appear here…</div>
            </div>
            {/* Composer */}
            <div style={{ borderTop: "1px solid #eee", padding: 12, display: "flex", gap: 10, alignItems: "flex-end", background: "#fafafa", borderRadius: "0 0 12px 12px" }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={mode === "PRIVATE" ? "Write a private message…" : "Write a group message…"}
                rows={1}
                style={{ flex: 1, minHeight: 44, maxHeight: 120, resize: "none", borderRadius: 10, border: "1px solid #ddd", padding: "10px 12px", outline: "none", fontFamily: "inherit" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button onClick={handleSend} disabled={disabledSend} title="Send message" style={{
                background: disabledSend ? "#d1d5db" : "#1565c0",
                color: "#fff",
                border: "none",
                width: 44,
                height: 44,
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: disabledSend ? "not-allowed" : "pointer",
                transition: "all .15s ease"
              }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div style={{ marginTop: 12, color: "#6b7280", fontSize: 13 }}>
        <div>Note: Actions are currently mocked. Wire them to your backend endpoints for full functionality.</div>
      </div>

      <style jsx>{`
        button { gap: 8px; }
      `}</style>
    </div>
  );
}

const btnSecondaryStyle: React.CSSProperties = {
  background: "#fff",
  color: "#1565c0",
  border: "1px solid #cbd5e1",
  padding: "8px 12px",
  borderRadius: 8,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  fontWeight: 600,
};
