"use client";
import React from "react";
import Image from "next/image";
import { formatNaira, formatDate } from "@/lib/format";
import { CheckCircle2, User, Home, FileText, Phone, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TransactionReportProps {
  transaction: any;
  onClose?: () => void;
}

export function TransactionReport({ transaction, onClose }: TransactionReportProps) {
  if (!transaction) return null;

  const data = transaction.response || {};
  const isSuccessful = transaction.status === "successful";

  if (!isSuccessful) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Detailed report is only available for successful transactions.</p>
        {onClose && (
          <Button variant="outline" className="mt-4" onClick={onClose}>Close</Button>
        )}
      </div>
    );
  }

  const images = {
    photo: data.photo || data.image || data.imageUrl,
    signature: data.signature,
    document: data.document,
  };

  const isPdf = (url?: string) => url?.toLowerCase().includes('.pdf');

  // Extract other metadata skipping images
  const details = Object.entries(data).filter(([key]) => 
    !['photo', 'image', 'imageUrl', 'signature', 'document'].includes(key)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-xl overflow-hidden shadow-lg border print:shadow-none print:border-none print:w-full">
      {/* Header */}
      <div className="bg-primary/5 p-6 border-b flex justify-between items-center print:bg-white print:border-b-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-primary">Verification Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Reference: <span className="font-mono text-foreground">{transaction.reference}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            Verified
          </div>
          <p className="text-xs text-muted-foreground mt-2">{formatDate(transaction.created_at)}</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Profile Section */}
        {(images.photo || data.firstName || data.lastName || data.surname || data.fullName) && (
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {images.photo && (
              <div className="shrink-0 relative w-32 h-32">
                {isPdf(images.photo) ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-xl border-2 border-primary/20">
                    <a href={images.photo} target="_blank" rel="noreferrer" className="text-xs text-primary font-semibold flex flex-col items-center gap-1">
                      <Download className="w-5 h-5" />
                      View PDF
                    </a>
                  </div>
                ) : (
                  <Image 
                    src={images.photo} 
                    alt="Profile" 
                    fill
                    unoptimized
                    className="rounded-xl object-cover border-2 border-primary/20 shadow-sm bg-muted"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>
            )}
            
            <div className="flex-1 space-y-4">
              <div className="pb-2 border-b">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <DetailRow label="Name" value={data.fullName || `${data.firstName || ''} ${data.middleName || data.middlename || ''} ${data.lastName || data.surname || ''}`} />
                <DetailRow label="Gender" value={data.gender} />
                <DetailRow label="Date of Birth" value={data.dateOfBirth || data.birthdate} />
                <DetailRow label="Phone" value={data.phone || data.telephoneno || data.phoneNumber} />
                <DetailRow label="Email" value={data.email} />
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Details */}
        <div className="space-y-4">
          <div className="pb-2 border-b">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Document Details
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {details.map(([key, value]) => {
              if (typeof value === 'object' || !value) return null;
              // Skip fields already shown in personal info
              if (['firstName', 'lastName', 'surname', 'middleName', 'middlename', 'fullName', 'gender', 'dateOfBirth', 'birthdate', 'phone', 'telephoneno', 'phoneNumber', 'email', 'message', 'success', 'statusCode', 'response_code', 'customer'].includes(key)) return null;
              
              return (
                <DetailRow 
                  key={key} 
                  label={key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')} 
                  value={String(value)} 
                />
              );
            })}
          </div>
        </div>

        {/* Signature */}
        {images.signature && (
          <div className="space-y-4">
            <div className="pb-2 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Signature
              </h3>
            </div>
            <div className="bg-white border rounded-lg p-4 inline-block relative h-20 w-48">
              {isPdf(images.signature) ? (
                <a href={images.signature} target="_blank" rel="noreferrer" className="flex items-center justify-center h-full text-sm font-semibold text-primary">
                  View PDF
                </a>
              ) : (
                <Image 
                  src={images.signature} 
                  alt="Signature" 
                  fill
                  unoptimized
                  className="object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
          </div>
        )}

        {/* Document */}
        {images.document && (
          <div className="space-y-4">
            <div className="pb-2 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Document File
              </h3>
            </div>
            <div className="bg-white border rounded-lg p-4 inline-block relative h-32 w-48">
              {isPdf(images.document) ? (
                <a href={images.document} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-full text-sm font-semibold text-primary gap-2 bg-muted rounded-lg">
                  <Download className="w-6 h-6" />
                  Download PDF
                </a>
              ) : (
                <Image 
                  src={images.document} 
                  alt="Document" 
                  fill
                  unoptimized
                  className="object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="bg-muted/30 p-4 border-t flex justify-end gap-3 print:hidden">
        {onClose && (
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Report
        </Button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: any }) {
  if (!value || value === "Not Available") return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground capitalize">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}
