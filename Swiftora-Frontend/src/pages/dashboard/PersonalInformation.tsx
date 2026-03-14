import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { kycApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  Building2,
  Landmark,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from "lucide-react";

type FileState = {
  file: File | null;
  preview: string | null;
};

export default function PersonalInformation() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState("NOT_STARTED");

  // Identity
  const [panNumber, setPanNumber] = useState("");
  const [panImage, setPanImage] = useState<FileState>({ file: null, preview: null });
  const [aadhaarImage, setAadhaarImage] = useState<FileState>({ file: null, preview: null });

  // Business
  const [gstNumber, setGstNumber] = useState("");
  const [gstCertificate, setGstCertificate] = useState<FileState>({ file: null, preview: null });

  // Bank
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [cancelledCheque, setCancelledCheque] = useState<FileState>({ file: null, preview: null });

  // Existing uploaded URLs
  const [existingUrls, setExistingUrls] = useState<Record<string, string | null>>({});

  const panRef = useRef<HTMLInputElement>(null);
  const aadhaarRef = useRef<HTMLInputElement>(null);
  const gstRef = useRef<HTMLInputElement>(null);
  const chequeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadKycStatus();
  }, []);

  const loadKycStatus = async () => {
    try {
      const res = await kycApi.getStatus();
      const d = res.data;
      setKycStatus(d.kycStatus);
      if (d.data) {
        if (d.data.panNumber) setPanNumber(d.data.panNumber);
        if (d.data.gstNumber) setGstNumber(d.data.gstNumber);
        if (d.data.bankAccountName) setBankAccountName(d.data.bankAccountName);
        if (d.data.bankName) setBankName(d.data.bankName);
        if (d.data.bankAccountNumber) setBankAccountNumber(d.data.bankAccountNumber);
        if (d.data.bankIfscCode) setBankIfscCode(d.data.bankIfscCode);
        setExistingUrls({
          panImageUrl: d.data.panImageUrl,
          aadhaarImageUrl: d.data.aadhaarImageUrl,
          gstCertificateUrl: d.data.gstCertificateUrl,
          cancelledChequeUrl: d.data.cancelledChequeUrl,
        });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: FileState) => void
  ) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5 MB");
      return;
    }
    const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
    setter({ file: f, preview });
  };

  const handleSubmit = async () => {
    if (!panNumber.trim() || panNumber.trim().length < 10) {
      toast.error("PAN number is required (10 characters)");
      return;
    }
    if (!bankAccountName.trim() || !bankName.trim() || !bankAccountNumber.trim() || !bankIfscCode.trim()) {
      toast.error("All bank details are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("panNumber", panNumber.trim().toUpperCase());
      if (gstNumber.trim()) fd.append("gstNumber", gstNumber.trim().toUpperCase());
      fd.append("bankAccountName", bankAccountName.trim());
      fd.append("bankName", bankName.trim());
      fd.append("bankAccountNumber", bankAccountNumber.trim());
      fd.append("bankIfscCode", bankIfscCode.trim().toUpperCase());

      if (panImage.file) fd.append("panImage", panImage.file);
      if (aadhaarImage.file) fd.append("aadhaarImage", aadhaarImage.file);
      if (gstCertificate.file) fd.append("gstCertificate", gstCertificate.file);
      if (cancelledCheque.file) fd.append("cancelledCheque", cancelledCheque.file);

      await kycApi.submit(fd);
      setKycStatus("PENDING_ADMIN_REVIEW");

      if (user?.merchant) {
        setUser({ ...user, merchant: { ...user.merchant, kycStatus: "PENDING_ADMIN_REVIEW" } });
      }

      toast.success("KYC submitted successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit KYC");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div className="animate-spin" style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#3b82f6", borderRadius: "50%", margin: "0 auto 12px" }} />
          Loading...
        </div>
      </div>
    );
  }

  if (kycStatus === "PENDING_ADMIN_REVIEW") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          borderRadius: 20, padding: 48, border: "1px solid #fcd34d"
        }}>
          <Clock size={56} style={{ color: "#d97706", margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#92400e", marginBottom: 12 }}>
            Verification Under Review
          </h2>
          <p style={{ color: "#a16207", fontSize: 15, lineHeight: 1.6 }}>
            Your KYC documents have been submitted and are currently under review.
            You will gain full access once approved by our team.
          </p>
        </div>
      </div>
    );
  }

  if (kycStatus === "VERIFIED") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
          borderRadius: 20, padding: 48, border: "1px solid #86efac"
        }}>
          <CheckCircle2 size={56} style={{ color: "#16a34a", margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#166534", marginBottom: 12 }}>
            Verification Complete
          </h2>
          <p style={{ color: "#15803d", fontSize: 15, lineHeight: 1.6 }}>
            Your identity has been verified. You have full access to all platform features.
          </p>
        </div>
      </div>
    );
  }

  if (kycStatus === "REJECTED") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <div style={{
          background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
          borderRadius: 20, padding: 48, border: "1px solid #fca5a5"
        }}>
          <XCircle size={56} style={{ color: "#dc2626", margin: "0 auto 20px" }} />
          <h2 style={{ fontSize: 24, fontWeight: 700, color: "#991b1b", marginBottom: 12 }}>
            Verification Rejected
          </h2>
          <p style={{ color: "#b91c1c", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
            Your KYC was not approved. Please re-submit with correct documents.
          </p>
          <button
            onClick={() => setKycStatus("NOT_STARTED")}
            style={{
              background: "#dc2626", color: "#fff", border: "none", borderRadius: 10,
              padding: "12px 32px", fontSize: 15, fontWeight: 600, cursor: "pointer",
            }}
          >
            Re-submit Documents
          </button>
        </div>
      </div>
    );
  }

  const FileUploadBox = ({
    label,
    fileState,
    existingUrl,
    inputRef,
    onChange,
    accept = "image/jpeg,image/png,image/webp",
  }: {
    label: string;
    fileState: FileState;
    existingUrl?: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    accept?: string;
  }) => (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.click()}
        style={{
          border: "2px dashed #d1d5db",
          borderRadius: 12,
          padding: 20,
          textAlign: "center",
          cursor: "pointer",
          background: fileState.file ? "#f0fdf4" : "#fafafa",
          transition: "all 0.2s",
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) {
            const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : null;
            onChange({ target: { files: [f] } } as any);
          }
        }}
      >
        {fileState.preview ? (
          <img src={fileState.preview} alt="" style={{ maxHeight: 100, maxWidth: "100%", borderRadius: 8, margin: "0 auto" }} />
        ) : fileState.file ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <FileText size={20} style={{ color: "#3b82f6" }} />
            <span style={{ fontSize: 13, color: "#374151" }}>{fileState.file.name}</span>
          </div>
        ) : existingUrl ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
            <span style={{ fontSize: 13, color: "#16a34a" }}>Already uploaded</span>
          </div>
        ) : (
          <>
            <Upload size={24} style={{ color: "#9ca3af", margin: "0 auto 8px" }} />
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
              Click or drag file to upload
            </p>
            <p style={{ fontSize: 11, color: "#9ca3af", margin: "4px 0 0" }}>Max 5 MB</p>
          </>
        )}
        <input
          ref={inputRef as any}
          type="file"
          accept={accept}
          onChange={onChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: 0 }}>
          Personal Information
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
          Complete your identity verification to unlock full platform access.
        </p>
      </div>

      {/* Section 1 -- Identity */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
        padding: 28, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
          }}>
            <Shield size={20} style={{ color: "#2563eb" }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Identity Verification
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>PAN card and Aadhaar details</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              PAN Number <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={panNumber}
              onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
              placeholder="ABCDE1234F"
              maxLength={10}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #d1d5db", fontSize: 14, outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FileUploadBox
              label="PAN Card Image"
              fileState={panImage}
              existingUrl={existingUrls.panImageUrl}
              inputRef={panRef}
              onChange={(e) => handleFileChange(e, setPanImage)}
            />
            <FileUploadBox
              label="Aadhaar Card Image"
              fileState={aadhaarImage}
              existingUrl={existingUrls.aadhaarImageUrl}
              inputRef={aadhaarRef}
              onChange={(e) => handleFileChange(e, setAadhaarImage)}
            />
          </div>
        </div>
      </div>

      {/* Section 2 -- Business (Optional) */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
        padding: 28, marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          }}>
            <Building2 size={20} style={{ color: "#d97706" }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Business Details
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Optional — GST registration details</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              GST Number
            </label>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="22AAAAA0000A1Z5"
              maxLength={15}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #d1d5db", fontSize: 14, outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>

          <FileUploadBox
            label="GST Certificate (PDF / Image)"
            fileState={gstCertificate}
            existingUrl={existingUrls.gstCertificateUrl}
            inputRef={gstRef}
            onChange={(e) => handleFileChange(e, setGstCertificate)}
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />
        </div>
      </div>

      {/* Section 3 -- Bank Verification */}
      <div style={{
        background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0",
        padding: 28, marginBottom: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, display: "flex",
            alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
          }}>
            <Landmark size={20} style={{ color: "#059669" }} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: 0 }}>
              Bank Verification
            </h3>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Account details for settlements</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Account Holder Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="Full name as on bank account"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #d1d5db", fontSize: 14, outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Bank Name <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. State Bank of India"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #d1d5db", fontSize: 14, outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Account Number <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="Bank account number"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #d1d5db", fontSize: 14, outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              IFSC Code <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="text"
              value={bankIfscCode}
              onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
              placeholder="e.g. SBIN0001234"
              maxLength={11}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1px solid #d1d5db", fontSize: 14, outline: "none",
                transition: "border-color 0.2s", boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <FileUploadBox
            label="Cancelled Cheque Image"
            fileState={cancelledCheque}
            existingUrl={existingUrls.cancelledChequeUrl}
            inputRef={chequeRef}
            onChange={(e) => handleFileChange(e, setCancelledCheque)}
          />
        </div>
      </div>

      {/* Submit */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, paddingBottom: 48 }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "12px 28px", borderRadius: 10, border: "1px solid #d1d5db",
            background: "#fff", color: "#374151", fontSize: 15, fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          style={{
            padding: "12px 36px", borderRadius: 10, border: "none",
            background: isSubmitting
              ? "#93c5fd"
              : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
            color: "#fff", fontSize: 15, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(59,130,246,0.3)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {isSubmitting ? (
            <>
              <div style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              Submitting...
            </>
          ) : (
            "Submit Verification"
          )}
        </button>
      </div>
    </div>
  );
}
