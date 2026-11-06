"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { Search, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";

interface UserSecretCodeStatus {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  roles: string[];
  secretCodeStatus: string;
  resetRequired: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  lastResetDate: string | null;
}

export default function SecretCodeManagementPage() {
  const [users, setUsers] = useState<UserSecretCodeStatus[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSecretCodeStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [resetDialog, setResetDialog] = useState<{ userId: string; userName: string } | { userId: string; userName: string }[] | null>(null);
  const [resetReason, setResetReason] = useState("");
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
      const response = await fetch("http://localhost:4000/api/secret-code/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!resetDialog || !resetReason.trim()) {
      setError("Please provide a reason for the reset");
      return;
    }

    setResetting(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("jwt") || localStorage.getItem("token");
      
      // Handle single user reset
      if (!Array.isArray(resetDialog)) {
        const response = await fetch(`http://localhost:4000/api/secret-code/reset/${resetDialog.userId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: resetReason }),
        });

        if (!response.ok) {
          throw new Error("Failed to reset secret code");
        }
      } else {
        // Handle batch reset
        const promises = resetDialog.map(user =>
          fetch(`http://localhost:4000/api/secret-code/reset/${user.userId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: resetReason }),
          })
        );

        const results = await Promise.all(promises);
        const failed = results.filter(r => !r.ok);
        
        if (failed.length > 0) {
          throw new Error(`Failed to reset ${failed.length} secret codes`);
        }
      }

      // Refresh the list
      await fetchUsers();
      setResetDialog(null);
      setResetReason("");
      setSelectedUsers(new Set());
      setSelectAll(false);
    } catch (err: any) {
      setError(err.message || "Failed to reset secret code");
    } finally {
      setResetting(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleBatchReset = () => {
    const selectedUserObjects = filteredUsers.filter(u => selectedUsers.has(u.id));
    if (selectedUserObjects.length === 0) return;
    setResetDialog(selectedUserObjects.map(u => ({ userId: u.id, userName: u.fullName })));
  };

  const getStatusBadge = (status: string, resetRequired: boolean) => {
    if (resetRequired) {
      return <Badge style={{ background: "#fef3c7", color: "#92400e" }}>RESET REQUIRED</Badge>;
    }
    if (status === "ACTIVE") {
      return <Badge style={{ background: "#dcfce7", color: "#166534" }}>ACTIVE</Badge>;
    }
    return <Badge style={{ background: "#f3f4f6", color: "#374151" }}>NOT CREATED</Badge>;
  };

  const isLocked = (lockedUntil: string | null) => {
    if (!lockedUntil) return false;
    return new Date(lockedUntil) > new Date();
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
              Secret Code Management
            </div>
            <div style={{ fontSize: 14, color: "#64748b" }}>
              Manage user secret codes for confidential complaint and investigation access
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                  width: 20,
                  height: 20,
                }}
              />
              <Input
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 40 }}
              />
            </div>
            <Button onClick={fetchUsers} disabled={loading}>
              <RefreshCw style={{ width: 16, height: 16, marginRight: 8 }} />
              Refresh
            </Button>
            {selectedUsers.size > 0 && (
              <Button onClick={handleBatchReset} style={{ background: "#dc2626" }}>
                Reset Selected ({selectedUsers.size})
              </Button>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "#fee2e2",
                color: "#dc2626",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <AlertCircle style={{ width: 20, height: 20 }} />
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#64748b" }}>Loading...</div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600, width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      User
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Department
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Roles
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Status
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Failed Attempts
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Last Reset
                    </th>
                    <th style={{ padding: "12px 16px", textAlign: "center", fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px", width: 40 }}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{user.fullName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{user.email}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        {user.department || "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {user.roles.slice(0, 2).map((role) => (
                            <Badge key={role} style={{ fontSize: 11 }}>
                              {role}
                            </Badge>
                          ))}
                          {user.roles.length > 2 && (
                            <Badge style={{ fontSize: 11 }}>+{user.roles.length - 2}</Badge>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {getStatusBadge(user.secretCodeStatus, user.resetRequired)}
                          {isLocked(user.lockedUntil) && (
                            <Badge style={{ background: "#fee2e2", color: "#dc2626", fontSize: 10 }}>
                              LOCKED
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        {user.failedAttempts}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>
                        {user.lastResetDate ? new Date(user.lastResetDate).toLocaleDateString() : "-"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {user.secretCodeStatus === "ACTIVE" && (
                          <Button
                            size="sm"
                            onClick={() => setResetDialog({ userId: user.id, userName: user.fullName })}
                          >
                            Reset
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
                  No users found
                </div>
              )}
            </div>
          )}

          {/* Reset Dialog */}
          {resetDialog && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  maxWidth: 500,
                  width: "90%",
                }}
              >
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                  Reset Secret Code
                </div>
                <div style={{ marginBottom: 16, color: "#64748b" }}>
                  {Array.isArray(resetDialog) ? (
                    <>
                      Are you sure you want to reset secret codes for <strong>{resetDialog.length} users</strong>?
                    </>
                  ) : (
                    <>
                      Are you sure you want to reset the secret code for <strong>{resetDialog.userName}</strong>?
                    </>
                  )}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                    Reason for Reset
                  </label>
                  <textarea
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    placeholder="Enter the reason for resetting this user's secret code"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      minHeight: 80,
                      resize: "vertical",
                    }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <Button variant="outline" onClick={() => setResetDialog(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleReset} disabled={resetting}>
                    {resetting ? "Resetting..." : "Confirm Reset"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
