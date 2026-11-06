"use client";

import { useState } from "react";
// @ts-ignore
import domtoimage from "dom-to-image";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Send, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GuestAntiCorruptionPage() {
  const router = useRouter();
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  const [reportData, setReportData] = useState({
    complainantName: "",
    complainantEmail: "",
    complainantPhone: "",
    category: "",
    subject: "",
    description: "",
    department: "",
    person: "",
    incidentLocation: "",
    incidentDate: "",
  });
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consentDeclaration, setConsentDeclaration] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({
    trackingId: "",
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== Form Submission Started ===');
    console.log('reportData:', reportData);
    console.log('consentDeclaration:', consentDeclaration);
    setReportLoading(true);
    setReportMsg("");

    // Validate required fields
    if (!reportData.description || reportData.description.length < 50) {
      console.log('Validation failed: Description too short');
      setReportMsg("Description must be at least 50 characters long.");
      setReportLoading(false);
      return;
    }

    if (!reportData.category) {
      console.log('Validation failed: Category missing');
      setReportMsg("Category is required.");
      setReportLoading(false);
      return;
    }

    if (!consentDeclaration) {
      console.log('Validation failed: Consent not checked');
      setReportMsg("You must agree to the declaration.");
      setReportLoading(false);
      return;
    }

    try {
      const payload = {
        complainantName: reportData.complainantName || "",
        complainantEmail: reportData.complainantEmail || "",
        complainantPhone: reportData.complainantPhone || "",
        category: reportData.category,
        subject: reportData.person || reportData.category,
        description: reportData.description,
        department: reportData.department,
        incidentLocation: reportData.incidentLocation,
        incidentDate: reportData.incidentDate,
        isAnonymous: !reportData.complainantName && !reportData.complainantEmail && !reportData.complainantPhone,
        isInternal: false,
        reportingChannel: 'public_portal',
        priority: "Low",
        consentDeclaration: true,
        consentAccuracy: true,
      };
      console.log('=== Submitting to Backend ===');
      console.log('URL:', "http://localhost:4000/api/ethics/anticorruption/reports/public");
      console.log('Payload:', JSON.stringify(payload, null, 2));
      console.log('Payload keys:', Object.keys(payload));

      const res = await fetch("http://localhost:4000/api/ethics/anticorruption/reports/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);
      console.log('Response ok:', res.ok);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('=== Submission Error ===');
        console.error('Error text:', errorText);
        console.error('Error status:', res.status);
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error JSON:', errorJson);
          setReportMsg(errorJson.message || errorText || "Failed to submit report");
        } catch {
          console.error('Could not parse error as JSON');
          setReportMsg(errorText || "Failed to submit report");
        }
        setReportLoading(false);
        return;
      }

      const data = await res.json();
      console.log('=== Submission Success ===');
      console.log('Response data:', data);
      setTrackingInfo({
        trackingId: data.trackingId || data.id,
      });
      setReportMsg("Ethics and Anti-Corruption report submitted successfully! Please save your tracking ID.");
      setReportData({
        complainantName: "",
        complainantEmail: "",
        complainantPhone: "",
        category: "",
        subject: "",
        description: "",
        department: "",
        person: "",
        incidentLocation: "",
        incidentDate: "",
      });
      setConsentDeclaration(false);
    } catch (err: any) {
      console.error('=== Exception Caught ===');
      console.error('Error:', err);
      console.error('Error message:', err.message);
      setReportMsg(err.message || "Failed to submit report");
    } finally {
      setReportLoading(false);
      console.log('=== Form Submission Ended ===');
    }
  };

  const handleTrackReport = () => {
    if (trackingInfo.trackingId) {
      router.push(`/guest-complaint/${trackingInfo.trackingId}`);
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
      });

      console.log('Image generated successfully');
      const link = document.createElement('a');
      link.download = `report-card-${trackingInfo.trackingId}.png`;
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
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-7xl">
        <CardHeader className="text-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/track-complaint")}
            className="aspect-square h-16 flex flex-col items-center justify-center text-sm mx-auto mb-4 font-bold text-green-600"
          >
            ጥቆማዎን ይከታተሉ
          </Button>
        </CardHeader>
        <CardContent>
          {!trackingInfo.trackingId ? (
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div>
                <Label htmlFor="category">የጥቆማ አይነት *</Label>
                <Select
                  value={reportData.category}
                  onValueChange={(value) => setReportData({ ...reportData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bribery">Bribery</SelectItem>
                    <SelectItem value="Fraud">Fraud</SelectItem>
                    <SelectItem value="Embezzlement">Embezzlement</SelectItem>
                    <SelectItem value="Conflict_of_Interest">Conflict of Interest</SelectItem>
                    <SelectItem value="Nepotism">Nepotism</SelectItem>
                    <SelectItem value="Misuse_of_Position">Misuse of Position</SelectItem>
                    <SelectItem value="Procurement_Fraud">Procurement Fraud</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">የጉዳዩ ዝርዝር*</Label>
                <Textarea
                  id="description"
                  value={reportData.description}
                  onChange={(e) => setReportData({ ...reportData, description: e.target.value })}
                  placeholder="Provide detailed description of the ethics violation or corruption (minimum 50 characters)"
                  rows={6}
                  required
                  minLength={50}
                />
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">የጠቋሚዉ መረጃ</h3>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="isAnonymous"
                      checked={isAnonymous}
                      onCheckedChange={(checked) => {
                        setIsAnonymous(checked as boolean);
                        if (checked) {
                          setReportData({
                            ...reportData,
                            complainantName: "",
                            complainantEmail: "",
                            complainantPhone: "",
                          });
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label htmlFor="isAnonymous" className="font-semibold">
                        ስምዖን ሳይገልፁ ይላኩ
                      </Label>
                      <p className="text-sm text-gray-500 mt-1">
                        Your identity will not be disclosed
                      </p>
                    </div>
                  </div>

                  {!isAnonymous && (
                    <>
                      <div>
                        <Label htmlFor="complainantName">ሙሉ ስም (Optional)</Label>
                        <Input
                          id="complainantName"
                          value={reportData.complainantName}
                          onChange={(e) => setReportData({ ...reportData, complainantName: e.target.value })}
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="complainantEmail">ኢሜይል (Optional)</Label>
                        <Input
                          id="complainantEmail"
                          type="email"
                          value={reportData.complainantEmail}
                          onChange={(e) => setReportData({ ...reportData, complainantEmail: e.target.value })}
                          placeholder="Enter your email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="complainantPhone">ስልክ ቁጥር (Optional)</Label>
                        <Input
                          id="complainantPhone"
                          type="tel"
                          value={reportData.complainantPhone}
                          onChange={(e) => setReportData({ ...reportData, complainantPhone: e.target.value })}
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">የጉዳዩ ዝርዝር</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="department">ጥቆማ የሚሰጥበት የስራ ክፍል</Label>
                    <Input
                      id="department"
                      value={reportData.department}
                      onChange={(e) => setReportData({ ...reportData, department: e.target.value })}
                      placeholder="Enter department name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="person">ጥቆማ የተደረገበት አካል</Label>
                    <Input
                      id="person"
                      value={reportData.person}
                      onChange={(e) => setReportData({ ...reportData, person: e.target.value })}
                      placeholder="Enter person/entity name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="incidentLocation">ጉዳዩ የተፈመበት ቦታ</Label>
                    <Input
                      id="incidentLocation"
                      value={reportData.incidentLocation}
                      onChange={(e) => setReportData({ ...reportData, incidentLocation: e.target.value })}
                      placeholder="Enter location where incident occurred"
                    />
                  </div>

                  <div>
                    <Label htmlFor="incidentDate">ጉዳዩ የተፈፀመበት ቀን</Label>
                    <Input
                      id="incidentDate"
                      type="date"
                      value={reportData.incidentDate}
                      onChange={(e) => setReportData({ ...reportData, incidentDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consentDeclaration"
                  checked={consentDeclaration}
                  onCheckedChange={(checked) => setConsentDeclaration(checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor="consentDeclaration" className="font-semibold">
                       የቀረበው መረጃ ትክክለኛ መሆኑን አረጋግጣለሁ።                   </Label>
                </div>
              </div>

              {reportMsg && (
                <div className={`p-4 rounded-lg ${reportMsg.includes("success") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                  {reportMsg}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={reportLoading}>
                {reportLoading ? "Submitting..." : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              {/* Printable Card */}
              <div id="printable-card" style={{ backgroundColor: '#ffffff', border: '2px solid #d1d5db', borderRadius: '8px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxWidth: '448px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>የጥቆማ ማረጋገጫ ካርድ</div>
                  <div style={{ fontSize: '14px', color: '#4b5563' }}>Ethics & Anti-Corruption Verification Card</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: '#fee2e2', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b', marginBottom: '4px' }}>TRACKING ID</div>
                    <div style={{ fontSize: '20px', fontFamily: 'monospace', fontWeight: 'bold', color: '#7f1d1d' }}>{trackingInfo.trackingId}</div>
                  </div>

                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>SUBMISSION DATE</div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{new Date().toLocaleDateString()}</div>
                  </div>

                  <div style={{ backgroundColor: '#fef9c3', padding: '16px', borderRadius: '8px', border: '1px solid #fde047' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#854d0e', marginBottom: '8px' }}>⚠️ IMPORTANT</div>
                    <div style={{ fontSize: '12px', color: '#713f12', lineHeight: '1.5' }}>
                      track ID በጥንቃቄ ይያዙ ጥቆማዎ ምን ደረጃ ላይ እንደደረሰ የሚከታተተሉበት ቁጥሮዎ ነዉ ከእርስዎ ዉጭ ለማንም አይስጡ
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
                    setReportMsg("");
                  }}
                >
                  Submit Another Report
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
