"use client";

import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/http";
import { DashboardLayout } from "@/app/components/dashboard-layout";
import { AuthGuard } from "@/app/components/auth-guard";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type User = { id: string; name: string; email?: string; role?: string; department?: string };
type Message = { id: string; from: string; fromName?: string; to: string; toName?: string; text: string; attachments?: string[]; createdAt: string; readBy?: string[] };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("accessToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("token") ||
    null
  );
}

export default function MessagesPage() {
  const [me, setMe] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [usersQ, setUsersQ] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [toId, setToId] = useState<string>("");
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const [replyMode, setReplyMode] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [replySending, setReplySending] = useState(false);
  const [replyUploading, setReplyUploading] = useState(false);

  const [items, setItems] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  // Try to derive user id from token (best-effort)
  useEffect(() => {
    (async () => {
      try {
        const t = getToken();
        if (!t) return;
        const parts = t.split(".");
        if (parts.length >= 2) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          console.log('JWT payload:', payload);
          // Try to get userId from payload first, then fallback to email/sub
          const userId: string | null = payload?.userId || payload?.sub || null;
          if (userId && typeof userId === "string") {
            setMe(String(userId));
            console.log('Set user ID from token:', userId);
          } else {
            // Fallback to search by email
            const sub: string | null = payload?.email || payload?.preferred_username || null;
            if (sub && typeof sub === "string") {
              const res = await apiFetch(`${BACKEND_URL}/api/users?search=${encodeURIComponent(sub)}&page=1&limit=1`);
              const j = await res.json();
              const match: any = Array.isArray(j.items) && j.items.length > 0 ? j.items[0] : null;
              if (match?.id) {
                setMe(String(match.id));
                console.log('Set user ID from search:', match.id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error deriving user ID:', error);
      }
    })();
  }, []);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await apiFetch(`${BACKEND_URL}/api/users?page=1&limit=100${usersQ ? `&search=${encodeURIComponent(usersQ)}` : ""}`);
      const j = await res.json();
      const usersList = j.users || j.items || [];
      setUsers(usersList.map((u: any) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`.trim(),
        email: u.email,
        role: u.roles?.[0],
        department: u.department
      })));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!me) {
      setItems([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    try {
      let url = `${BACKEND_URL}/api/messages?page=${page}&pageSize=${pageSize}`;
      url += `&from=${encodeURIComponent(me)}`;
      if (toId) {
        url += `&to=${encodeURIComponent(toId)}`;
      }
      const res = await apiFetch(url);
      const j = await res.json();
      const arr: Message[] = j.items || [];
      setItems(arr);
      setTotal(j.total || 0);
    } catch (error) {
      console.error('Error loading messages:', error);
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      loadUsers();
    }, 300);
    setSearchTimeout(timeout);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [usersQ]);

  useEffect(() => {
    loadMessages();
  }, [me, toId, page, pageSize]);

  // Mark conversation as read when recipient is selected
  useEffect(() => {
    if (me && toId) {
      (async () => {
        try {
          await apiFetch(`${BACKEND_URL}/api/messages/mark-conversation-read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ otherUserId: toId }),
          });
        } catch (error) {
          console.error('Error marking conversation as read:', error);
        }
      })();
    }
  }, [toId]);

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '';
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      endpoint = '/api/upload/pdf';
    } else if (file.type.startsWith('image/')) {
      endpoint = '/api/upload/image';
    } else if (file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
      endpoint = '/api/upload/document';
    } else {
      throw new Error('Unsupported file type');
    }

    const res = await apiFetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.url;
  };

  const onSend = async () => {
    if (!me) {
      alert('User ID not loaded. Please wait a moment and try again.');
      return;
    }
    if (!toId || (!text.trim() && attachments.length === 0)) {
      alert('Please select a recipient and enter a message or attach a file.');
      return;
    }
    setSending(true);
    setUploading(true);
    try {
      // Upload all attachments first
      const attachmentUrls: string[] = [];
      for (const file of attachments) {
        const url = await uploadFile(file);
        attachmentUrls.push(url);
      }

      await apiFetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: me, to: toId, text: text.trim(), attachments: attachmentUrls }),
      });
      setText("");
      setAttachments([]);
      setPage(1);
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const recipientName = useMemo(() => users.find((u) => u.id === toId)?.name || "", [users, toId]);

  const onMessageClick = async (message: Message) => {
    setSelectedMessage(message);

    // Mark the conversation as read
    const otherUserId = message.from === me ? message.to : message.from;
    if (me && otherUserId) {
      try {
        await apiFetch(`${BACKEND_URL}/api/messages/mark-conversation-read`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otherUserId }),
        });
      } catch (error) {
        console.error('Error marking conversation as read:', error);
      }
    }
  };

  const onReply = (message: Message) => {
    // When clicking reply, enable reply mode inline
    setReplyMode(true);
    setReplyText(`\n\n---\nReplying to: ${message.text.substring(0, 50)}${message.text.length > 50 ? '...' : ''}`);
    // Focus on reply textarea
    setTimeout(() => {
      const textarea = document.querySelector('#reply-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(0, 0);
      }
    }, 100);
  };

  const onSendReply = async () => {
    if (!me || !selectedMessage) {
      alert('User ID not loaded. Please wait a moment and try again.');
      return;
    }
    const otherUserId = selectedMessage.from === me ? selectedMessage.to : selectedMessage.from;
    if (!otherUserId || (!replyText.trim() && replyAttachments.length === 0)) {
      alert('Please enter a message or attach a file.');
      return;
    }
    setReplySending(true);
    setReplyUploading(true);
    try {
      const attachmentUrls: string[] = [];
      for (const file of replyAttachments) {
        const url = await uploadFile(file);
        attachmentUrls.push(url);
      }

      await apiFetch(`${BACKEND_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: me, to: otherUserId, text: replyText.trim(), attachments: attachmentUrls }),
      });
      setReplyText("");
      setReplyAttachments([]);
      setReplyMode(false);
      await loadMessages();
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply. Please try again.');
    } finally {
      setReplySending(false);
      setReplyUploading(false);
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl font-bold">Messages</h1>
          
          {/* Compose Message Card */}
          <Card>
            <CardHeader>
              <CardTitle>Compose New Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <div className="flex gap-2">
                  <Input
                    list="user-list"
                    value={toId ? selectedUserName : usersQ}
                    onChange={(e) => {
                      setUsersQ(e.target.value);
                      const selectedUser = users.find(u => u.name === e.target.value || u.email === e.target.value);
                      if (selectedUser) {
                        setToId(selectedUser.id);
                        setSelectedUserName(selectedUser.name);
                      }
                    }}
                    placeholder="Search users by name..."
                    className="flex-1"
                  />
                  <datalist id="user-list">
                    {users.filter(u => u.id !== me).map(u => (
                      <option key={u.id} value={u.name}>
                        {u.name} {u.email ? `(${u.email})` : ''}
                      </option>
                    ))}
                  </datalist>
                  {toId && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setToId("");
                        setSelectedUserName("");
                        setUsersQ("");
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
{usersLoading && <p className="text-sm text-gray-500 mt-1">Loading users...</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Attachments</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setAttachments(files);
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {attachments.map((file, idx) => (
                      <div key={idx} className="text-sm text-gray-600 flex items-center justify-between bg-gray-50 px-2 py-1 rounded">
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder={toId ? `Message to ${recipientName}` : 'Select a recipient first'}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={onSend} 
                  disabled={!toId || (!text.trim() && attachments.length === 0) || sending || uploading}
                >
                  {uploading ? 'Uploading...' : sending ? 'Sending...' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email-style Message View */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message List (Inbox) */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Inbox</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <p className="text-center py-4">Loading...</p>
                ) : items.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">No messages.</p>
                ) : (
                  <div className="divide-y">
                    {items.map((m) => (
                      <div
                        key={m.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedMessage?.id === m.id ? 'bg-blue-50' : ''
                        } ${!(m.readBy || []).includes(me) ? 'font-semibold' : ''}`}
                        onClick={() => onMessageClick(m)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm font-medium truncate">
                            {m.from === me ? 'Me' : m.fromName || m.from}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(m.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{m.text}</p>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-1 text-xs text-gray-500">
                            📎 {m.attachments.length} attachment{m.attachments.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {total > pageSize && (
                  <div className="p-4 border-t flex justify-between items-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-500">
                      {page} / {Math.ceil(total / pageSize)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * pageSize >= total}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Detail View */}
            <Card className="lg:col-span-2">
              <CardHeader>
                {selectedMessage ? (
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <CardTitle className="text-xl mb-2">
                          {selectedMessage.from === me ? 'To: ' + (selectedMessage.toName || selectedMessage.to) : 'From: ' + (selectedMessage.fromName || selectedMessage.from)}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {new Date(selectedMessage.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReply(selectedMessage)}
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <CardTitle>Select a message to view</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="whitespace-pre-wrap text-gray-800">{selectedMessage.text}</div>
                    {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs">
                            📎
                          </div>
                          <span className="text-xs font-medium text-gray-600">Attachments ({selectedMessage.attachments.length})</span>
                        </div>
                        <div className="space-y-2">
                          {selectedMessage.attachments.map((url, idx) => {
                            const fileName = url.split('/').pop() || `Attachment ${idx + 1}`;
                            const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                            const isPdf = /\.pdf$/i.test(fileName);
                            const isWord = /\.(doc|docx)$/i.test(fileName);
                            
                            let icon = '📎';
                            if (isImage) icon = '📷';
                            else if (isPdf) icon = '📄';
                            else if (isWord) icon = '📝';

                            if (isImage) {
                              return (
                                <div key={idx} className="mt-2">
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={url}
                                      alt={fileName}
                                      className="max-w-full h-auto rounded-lg border border-gray-200 cursor-pointer hover:opacity-90"
                                      style={{ maxHeight: '400px' }}
                                    />
                                  </a>
                                  <a
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 text-xs mt-1 inline-block"
                                  >
                                    {icon} {fileName}
                                  </a>
                                </div>
                              );
                            }

                            return (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-500 hover:text-blue-700 bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <span className="text-sm">{icon}</span>
                                <span className="truncate">{fileName}</span>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {replyMode && (
                      <div className="border-t pt-4 mt-4 bg-gray-50 p-4 rounded-lg">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium mb-2">Reply</label>
                            <textarea
                              id="reply-textarea"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={3}
                              placeholder="Type your reply..."
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-2">Attachments</label>
                            <input
                              type="file"
                              multiple
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setReplyAttachments(files);
                              }}
                              className="w-full px-3 py-2 border rounded-lg"
                            />
                            {replyAttachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {replyAttachments.map((file, idx) => (
                                  <div key={idx} className="text-sm text-gray-600 flex items-center justify-between bg-white px-2 py-1 rounded">
                                    <span>{file.name}</span>
                                    <button
                                      type="button"
                                      onClick={() => setReplyAttachments(prev => prev.filter((_, i) => i !== idx))}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setReplyMode(false);
                                setReplyText("");
                                setReplyAttachments([]);
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={onSendReply}
                              disabled={!replyText.trim() && replyAttachments.length === 0 || replySending || replyUploading}
                            >
                              {replyUploading ? 'Uploading...' : replySending ? 'Sending...' : 'Send Reply'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Click on a message from the inbox to view its details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
