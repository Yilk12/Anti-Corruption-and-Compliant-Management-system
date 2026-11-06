"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { ArrowLeft, Send, User, Calendar, Shield, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  message: string;
  senderId: string;
  senderRole: string;
  senderType: string;
  createdAt: string;
}

interface Complaint {
  id: string;
  trackingId: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  isAnonymous: boolean;
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  complainantDepartment?: string;
  complainantPosition?: string;
  incidentDate?: string;
  incidentLocation?: string;
  createdAt: string;
  messages?: Message[];
}

export default function GuestComplaintDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trackingId = params.trackingId as string;
  const [loading, setLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchComplaintDetails();
  }, [trackingId]);

  const fetchComplaintDetails = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaint details');
      }

      const data = await response.json();
      setComplaint(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching complaint details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Send Message Started ===');
    console.log('newMessage:', newMessage);
    console.log('trackingId:', trackingId);
    console.log('complaint exists:', !!complaint);
    
    if (!newMessage.trim() || !complaint) return;

    setSendingMessage(true);
    try {
      console.log('=== Trying Ethics Endpoint ===');
      console.log('URL:', "http://localhost:4000/api/ethics/anticorruption/reports/track/messages/send");
      const payload = {
        trackingId: trackingId,
        message: newMessage,
      };
      console.log('Payload:', JSON.stringify(payload, null, 2));

      let res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/track/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('Ethics endpoint response status:', res.status);
      console.log('Ethics endpoint response ok:', res.ok);

      // If ethics endpoint fails, try feedback endpoint (for general feedback complaints)
      if (!res.ok) {
        const errorText = await res.text();
        console.error('=== Ethics Endpoint Failed ===');
        console.error('Error text:', errorText);
        
        console.log('=== Trying Feedback Endpoint ===');
        console.log('URL:', "http://localhost:4000/api/feedback/complaints/track/messages/send");
        
        res = await fetch("http://localhost:4000/api/feedback/complaints/track/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        
        console.log('Feedback endpoint response status:', res.status);
        console.log('Feedback endpoint response ok:', res.ok);
        
        if (!res.ok) {
          const feedbackErrorText = await res.text();
          console.error('=== Feedback Endpoint Also Failed ===');
          console.error('Feedback error text:', feedbackErrorText);
          throw new Error(feedbackErrorText || 'Failed to send message');
        }
      }

      if (res.ok) {
        const data = await res.json();
        console.log('=== Message Send Success ===');
        console.log('Response data:', data);
        console.log('Current messages count:', messages.length);
        console.log('Adding new message to state');
        
        setMessages([...messages, data]);
        setNewMessage("");
        
        console.log('Reloading messages to get full details');
        // Reload messages to get full details
        fetchComplaintDetails();
      }
    } catch (err: any) {
      console.error('=== Send Message Exception ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      alert(err.message || 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
      console.log('=== Send Message Ended ===');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_INVESTIGATION':
        return 'bg-blue-100 text-blue-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="py-12 text-center">Loading...</CardContent>
        </Card>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="py-12 text-center">
            <Button onClick={() => router.push("/track-complaint")} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tracking
            </Button>
            <div className="text-red-600">Complaint not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Button onClick={() => router.push("/track-complaint")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tracking
        </Button>

        <div className="space-y-6">
          {/* Complaint Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{complaint.subject}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(complaint.status)}>
                      {complaint.status.replace(/_/g, ' ')}
                    </Badge>
                    <Badge className={getPriorityColor(complaint.priority)}>
                      {complaint.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Shield className="h-4 w-4" />
                    Tracking ID
                  </div>
                  <div className="font-mono text-lg">{complaint.trackingId}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <Calendar className="h-4 w-4" />
                    Submitted Date
                  </div>
                  <div>{new Date(complaint.createdAt).toLocaleString()}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Category</div>
                <div className="font-medium">{complaint.category}</div>
              </div>

              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <div className="bg-gray-50 p-4 rounded-lg">{complaint.description}</div>
              </div>

              {complaint.incidentDate && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Incident Date</div>
                  <div>{new Date(complaint.incidentDate).toLocaleDateString()}</div>
                </div>
              )}

              {complaint.incidentLocation && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">Incident Location</div>
                  <div>{complaint.incidentLocation}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reporter Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Reporter Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {complaint.isAnonymous ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-5 w-5" />
                  <span>This complaint was submitted anonymously</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {complaint.complainantName && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Name</div>
                      <div className="font-medium">{complaint.complainantName}</div>
                    </div>
                  )}
                  {complaint.complainantEmail && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Email</div>
                      <div>{complaint.complainantEmail}</div>
                    </div>
                  )}
                  {complaint.complainantPhone && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Phone</div>
                      <div>{complaint.complainantPhone}</div>
                    </div>
                  )}
                  {complaint.complainantDepartment && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Department</div>
                      <div>{complaint.complainantDepartment}</div>
                    </div>
                  )}
                  {complaint.complainantPosition && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Position</div>
                      <div>{complaint.complainantPosition}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-4 rounded-lg ${
                        msg.senderType === 'COMPLAINANT'
                          ? 'bg-blue-50 ml-8'
                          : 'bg-gray-100 mr-8'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {msg.senderType === 'COMPLAINANT' ? 'You' : msg.senderRole}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="flex-1"
                />
                <Button type="submit" disabled={sendingMessage || !newMessage.trim()} className="self-end">
                  {sendingMessage ? "Sending..." : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
