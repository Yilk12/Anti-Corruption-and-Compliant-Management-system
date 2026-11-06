"use client";

import { useState, useEffect } from "react";
// @ts-ignore
import domtoimage from "dom-to-image";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { MessageSquare, Send, CheckCircle, User, Hand, Paperclip, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GuestFeedbackPage() {
  const router = useRouter();
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string; nameAm?: string }>>([]);
  const [feedbackData, setFeedbackData] = useState({
    category: "",
    description: "",
    consentDeclaration: false,
    isAnonymous: true,
    complainantName: "",
    complainantEmail: "",
    complainantPhone: "",
    department: "",
    person: "",
    complaintText: "",
  });
  const [trackingInfo, setTrackingInfo] = useState({
    trackingId: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/feedback/departments");
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackLoading(true);
    setFeedbackMsg("");

    // Validate required fields
    if (!feedbackData.description || feedbackData.description.length < 50) {
      setFeedbackMsg("Description must be at least 50 characters long.");
      setFeedbackLoading(false);
      return;
    }

    if (!feedbackData.category) {
      setFeedbackMsg("Category is required.");
      setFeedbackLoading(false);
      return;
    }

    if (!feedbackData.consentDeclaration) {
      setFeedbackMsg("You must agree to the declaration.");
      setFeedbackLoading(false);
      return;
    }

    try {
      const payload: any = {
        complainantName: feedbackData.complainantName || "",
        complainantEmail: feedbackData.complainantEmail || "",
        complainantPhone: feedbackData.complainantPhone || "",
        category: feedbackData.category,
        subject: feedbackData.person || feedbackData.category,
        description: feedbackData.description,
        department: feedbackData.department,
        complaintText: feedbackData.complaintText || "",
        isAnonymous: !feedbackData.complainantName && !feedbackData.complainantEmail && !feedbackData.complainantPhone,
        isInternal: false,
        reportingChannel: 'public_portal',
        priority: "Low",
        consentDeclaration: feedbackData.consentDeclaration,
        consentAccuracy: true,
      };

      const res = await fetch("http://localhost:4000/api/feedback/complaints/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Submission error:', errorText);
        try {
          const errorJson = JSON.parse(errorText);
          setFeedbackMsg(errorJson.message || errorText || "Failed to submit feedback");
        } catch {
          setFeedbackMsg(errorText || "Failed to submit feedback");
        }
        setFeedbackLoading(false);
        return;
      }

      const data = await res.json();
      setTrackingInfo({
        trackingId: data.trackingId || data.id,
      });
      setFeedbackMsg("Feedback submitted successfully! Please save your tracking ID.");
      setFeedbackData({
        category: "",
        description: "",
        consentDeclaration: false,
        isAnonymous: true,
        complainantName: "",
        complainantEmail: "",
        complainantPhone: "",
        department: "",
        person: "",
        complaintText: "",
      });
      setAttachments([]);
    } catch (err: any) {
      setFeedbackMsg(err.message || "Failed to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleTrackFeedback = () => {
    if (trackingInfo.trackingId) {
      router.push(`/track-feedback?trackingId=${trackingInfo.trackingId}`);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    const cardElement = document.getElementById('printable-card');
    if (!cardElement) {
      console.error('Card element not found');
      alert('Card element not found. Please try again.');
      return;
    }

    try {
      console.log('Starting image generation...');
      
      const dataUrl = await domtoimage.toPng(cardElement, {
        quality: 1,
        bgcolor: '#ffffff',
        width: cardElement.scrollWidth,
        height: cardElement.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        },
      });

      console.log('Image generated successfully');
      const link = document.createElement('a');
      link.download = `complaint-card-${trackingInfo.trackingId}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Image downloaded successfully');
    } catch (error) {
      console.error('Error generating image:', error);
      alert(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-2xl">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">የቅሬታ ማስረጫ ቅጽ</h1>
          <p className="text-gray-600">እባክዎን ቅሬታ ያስገቡ</p>
        </CardHeader>
        <CardContent>
          {!trackingInfo.trackingId ? (
            <form onSubmit={handleFeedbackSubmit} className="space-y-6">
              <div>
                <Label htmlFor="category">የቅሬታ አይነት *</Label>
                <Select
                  value={feedbackData.category}
                  onValueChange={(value) => setFeedbackData({ ...feedbackData, category: value })}
                >
                  <SelectTrigger className="bg-yellow-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="የአገልግሎት ቅሬታ">የአገልግሎት ቅሬታ</SelectItem>
                    <SelectItem value="አስተዳደራዊ ጥቆማ">Administrative Complaints</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department field - only shown when የአገልግሎት ቅሬታ is selected */}
              {feedbackData.category === "የአገልግሎት ቅሬታ" && (
                <>
                  <div>
                    <Label htmlFor="department">ቅሬታ የሚሰጥበት የስራ ክፍል *</Label>
                    <Select
                      value={feedbackData.department}
                      onValueChange={(value) => setFeedbackData({ ...feedbackData, department: value })}
                    >
                      <SelectTrigger className="bg-yellow-50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length === 0 ? (
                          <SelectItem value="" disabled>No departments available</SelectItem>
                        ) : (
                          departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.nameAm || dept.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Complaint text field - only shown when አስተዳደራዊ ጥቆማ is selected */}
              {feedbackData.category === "አስተዳደራዊ ጥቆማ" && (
                <>
                  <div>
                    <Label htmlFor="complaintText">ቅሬታ *</Label>
                    <Textarea
                      id="complaintText"
                      value={feedbackData.complaintText || ''}
                      onChange={(e) => setFeedbackData({ ...feedbackData, complaintText: e.target.value })}
                      rows={4}
                      required
                      minLength={10}
                      className="bg-yellow-50"
                      placeholder="እባክዎን ቅሬታዎን ያስገቡ..."
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="description">የጉዳዩ ዝርዝር*</Label>
                <Textarea
                  id="description"
                  value={feedbackData.description}
                  onChange={(e) => setFeedbackData({ ...feedbackData, description: e.target.value })}
                  rows={6}
                  required
                  minLength={20}
                  className="bg-yellow-50"
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">የቅሬታ ላኪዉ መረጃ</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="complainantName">ሙሉ ስም (Optional)</Label>
                    <Input
                      id="complainantName"
                      value={feedbackData.complainantName}
                      onChange={(e) => setFeedbackData({ ...feedbackData, complainantName: e.target.value })}
                      className="bg-yellow-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complainantEmail">ኢሜይል (Optional)</Label>
                    <Input
                      id="complainantEmail"
                      type="email"
                      value={feedbackData.complainantEmail}
                      onChange={(e) => setFeedbackData({ ...feedbackData, complainantEmail: e.target.value })}
                      className="bg-yellow-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complainantPhone">ስልክ ቁጥር (Optional)</Label>
                    <Input
                      id="complainantPhone"
                      type="tel"
                      value={feedbackData.complainantPhone}
                      onChange={(e) => setFeedbackData({ ...feedbackData, complainantPhone: e.target.value })}
                      className="bg-yellow-50"
                    />
                  </div>
                </div>
              </div>

              {/* Attachment Section */}
              <div>
                <Label htmlFor="attachments">ቅጹል ሰነዶች (Optional)</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('attachments')?.click()}
                    className="w-12 h-12 p-0 flex items-center justify-center"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                          className="flex-shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">የቅሬታዉ ዝርዝር</h3>
                <div className="space-y-4">
                  {feedbackData.category === "የአገልግሎት ቅሬታ" && (
                    <div>
                      <Label htmlFor="person">ቅሬታ የተደረገበት አካል</Label>
                      <Input
                        id="person"
                        value={feedbackData.person}
                        onChange={(e) => setFeedbackData({ ...feedbackData, person: e.target.value })}
                        className="bg-yellow-50"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentDeclaration"
                  checked={feedbackData.consentDeclaration}
                  onCheckedChange={(checked) => setFeedbackData({ ...feedbackData, consentDeclaration: checked as boolean })}
                  className="border-green-500 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
                <div className="flex-1">
                  <Label htmlFor="consentDeclaration" className="font-semibold">
                   የቀረበው መረጃ በእኔ መረጃ ልክ እውነት እና ትክክለኛ መሆኑን አረጋግጣለሁ። *
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    ሀሰተኛ መረጃ የተቋምን ገፅታ ሊያጠፋ እንደሚችሉ እረዳለሁ።
                  </p>
                </div>
              </div>

              {feedbackMsg && (
                <div className={`p-4 rounded-lg ${feedbackMsg.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  {feedbackMsg}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={feedbackLoading}>
                {feedbackLoading ? "Submitting..." : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    ቅሬታዎን ይላኩ
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              {/* Printable Card */}
              <div id="printable-card" style={{ backgroundColor: '#ffffff', border: '2px solid #d1d5db', borderRadius: '8px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '448px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>የቅሬታ ማረጋገጫ ካርድ</div>
                  <div style={{ fontSize: '14px', color: '#4b5563' }}>Complaint Verification Card</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#dbeafe', padding: '16px', borderRadius: '8px', border: '1px solid #93c5fd' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', marginBottom: '4px' }}>TRACKING ID</div>
                    <div style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 'bold', color: '#1e3a8a' }}>{trackingInfo.trackingId}</div>
                  </div>

                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>SUBMISSION DATE</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{new Date().toLocaleDateString()}</div>
                  </div>

                  <div style={{ backgroundColor: '#fef9c3', padding: '16px', borderRadius: '8px', border: '1px solid #fde047' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#854d0e', marginBottom: '8px' }}>⚠️ IMPORTANT</div>
                    <div style={{ fontSize: '12px', color: '#713f12', lineHeight: '1.5' }}>
                      አይዲዎን ኮፒ አድርገዉ ይያዙ ለሌላ አካል አሳልፈዉ አይስጡ
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center no-print">
                <Button
                  variant="outline"
                  onClick={handlePrintCard}
                >
                  Print Card
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownloadImage}
                >
                  Download as Image
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTrackingInfo({ trackingId: "" });
                    setFeedbackMsg("");
                  }}
                >
                  ሌላ ቅሬታ ይላኩ
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            .no-print {
              display: none !important;
            }
            #printable-card {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 20px;
              box-shadow: none !important;
            }
            body {
              background: white !important;
            }
            @page {
              margin: 0.5cm;
              size: A4;
            }
          }
        `
      }} />
    </div>
  );
}
