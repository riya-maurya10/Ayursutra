import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileCheck,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Upload,
  User,
  UserCheck,
} from "lucide-react";
import {
  getInvitationByToken,
  registerStaff,
  uploadDocument,
} from "../../services/admin/staffInvitationService";
import type { StaffInvitationResponse } from "../../services/admin/staffInvitationService";

export default function StaffRegisterPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [loadingToken, setLoadingToken] = useState(true);
  const [tokenError, setTokenError] = useState("");
  const [invitation, setInvitation] = useState<StaffInvitationResponse | null>(null);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Doctor fields
  const [qualification, setQualification] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [medicalRegistrationNumber, setMedicalRegistrationNumber] = useState("");
  const [stateCouncil, setStateCouncil] = useState("");
  const [experienceYears, setExperienceYears] = useState("3");
  const [degreeCertUrl, setDegreeCertUrl] = useState("");
  const [degreeCertName, setDegreeCertName] = useState("");
  const [regCertUrl, setRegCertUrl] = useState("");
  const [regCertName, setRegCertName] = useState("");
  const [addCertUrl, setAddCertUrl] = useState("");
  const [addCertName, setAddCertName] = useState("");

  // Therapist fields
  const [therapistType, setTherapistType] = useState("SENIOR");
  const [therapySkillsInput, setTherapySkillsInput] = useState(
    "Abhyanga, Shirodhara, Swedana, Pizhichil, Kizhi"
  );
  const [trainingCertifications, setTrainingCertifications] = useState("");
  const [therapistQualCertUrl, setTherapistQualCertUrl] = useState("");
  const [therapistQualCertName, setTherapistQualCertName] = useState("");
  const [trainingCertUrl, setTrainingCertUrl] = useState("");
  const [trainingCertName, setTrainingCertName] = useState("");

  // Receptionist fields
  const [idProofUrl, setIdProofUrl] = useState("");
  const [idProofName, setIdProofName] = useState("");

  // Uploading state
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError("No invitation token provided. Please use the complete link provided by your clinic administrator.");
      setLoadingToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        setLoadingToken(true);
        setTokenError("");
        const inv = await getInvitationByToken(token);
        setInvitation(inv);

        if (inv.fullName) setFullName(inv.fullName);
        if (inv.phone) setPhone(inv.phone);

        if (inv.role === "DOCTOR") {
          setSpecialization("Panchakarma & Kayachikitsa");
          setQualification("BAMS, MD (Ayurveda)");
        } else if (inv.role === "THERAPIST") {
          setQualification("Diploma in Ayurvedic Panchakarma Therapy (DAPT)");
          setSpecialization("Panchakarma Therapy");
        }
      } catch (err: any) {
        setTokenError(
          err?.response?.data?.message ||
            "This invitation link is invalid, expired, or has already been used. Please request a new invitation from your clinic administrator."
        );
      } finally {
        setLoadingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldKey: string,
    setUrl: (url: string) => void,
    setName: (name: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setFormError("File size exceeds 15MB limit. Please choose a smaller document.");
      return;
    }

    try {
      setUploadingDoc(fieldKey);
      setFormError("");
      const url = await uploadDocument(file);
      setUrl(url);
      setName(file.name);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message || `Failed to upload ${file.name}. Please try again.`
      );
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!fullName.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!phone.trim()) {
      setFormError("Please enter your phone number.");
      return;
    }
    if (!password) {
      setFormError("Please enter a secure password.");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please verify.");
      return;
    }

    // Role-specific validation
    if (invitation?.role === "DOCTOR") {
      if (!qualification.trim()) {
        setFormError("Please specify your medical qualification (e.g., BAMS, MD).");
        return;
      }
      if (!medicalRegistrationNumber.trim()) {
        setFormError("Please provide your Medical Registration / License Number.");
        return;
      }
      if (!stateCouncil.trim()) {
        setFormError("Please specify your State Medical Council / Licensing Authority.");
        return;
      }
    } else if (invitation?.role === "THERAPIST") {
      if (!qualification.trim()) {
        setFormError("Please specify your therapist qualification or certification.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const skillsArray = therapySkillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!invitation) {
        setFormError("Invitation session not found. Please reload the link.");
        return;
      }

      await registerStaff({
        token,
        invitationToken: token,
        email: invitation.email,
        fullName: fullName.trim(),
        phone: phone.trim(),
        password,
        address: address.trim(),
        qualification: qualification.trim(),
        specialization: specialization.trim(),
        medicalRegistrationNumber: medicalRegistrationNumber.trim(),
        stateCouncil: stateCouncil.trim(),
        experienceYears: parseInt(experienceYears, 10) || 0,
        degreeCertificateUrl: degreeCertUrl,
        registrationCertificateUrl: regCertUrl,
        additionalCertificatesUrl: addCertUrl,
        therapistType,
        therapySkills: skillsArray,
        trainingCertifications: trainingCertifications.trim(),
        qualificationCertificateUrl: therapistQualCertUrl,
        trainingCertificateUrl: trainingCertUrl,
        idProofDocumentUrl: idProofUrl,
      });

      setSubmitted(true);
    } catch (err: any) {
      setFormError(
        err?.response?.data?.message ||
          "Registration failed. Please check the information and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Loading State
  if (loadingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-emerald-100">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-800 mb-2">Validating Staff Invitation</h2>
          <p className="text-stone-500 text-sm">
            Verifying your invitation credentials and clinic onboarding link...
          </p>
        </div>
      </div>
    );
  }

  // 2. Token Error State
  if (tokenError || !invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-rose-100">
          <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-2">Invalid or Expired Invitation</h2>
          <p className="text-stone-600 mb-6 leading-relaxed text-sm">
            {tokenError || "This invitation link is not valid or has expired."}
          </p>
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-500 text-left mb-6 space-y-1">
            <p className="font-semibold text-stone-700">What to do next:</p>
            <p>1. Check if the link was copied completely from your invitation email or message.</p>
            <p>2. Contact your AyurSutra clinic administrator to request a new invitation.</p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // 3. Submitted / Pending Verification State
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-stone-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-xl w-full text-center border border-emerald-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 mb-3">
            Status: Pending Admin Verification
          </span>
          <h2 className="text-3xl font-bold text-stone-800 mb-3">
            Application Submitted Successfully!
          </h2>
          <p className="text-stone-600 leading-relaxed text-sm mb-6">
            Thank you, <strong className="text-stone-800">{fullName}</strong>. Your registration as{" "}
            <strong className="text-emerald-800">{invitation.role}</strong> at{" "}
            <strong className="text-stone-800">{invitation.clinicName}</strong> has been submitted.
          </p>

          <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-2xl p-5 text-left text-xs text-stone-700 mb-8 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-emerald-900 text-sm mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              What happens now?
            </div>
            <p>
              • The clinic administrator will review your submitted credentials, certificates, and details.
            </p>
            <p>
              • As an Ayurveda medical facility, strict quality and clinical verification standards are maintained before granting clinical workspace access.
            </p>
            <p>
              • Once your application is reviewed and approved, you will be able to log in with your registered email (<strong>{invitation.email}</strong>) and password.
            </p>
          </div>

          <Link
            to="/login"
            className="w-full inline-flex items-center justify-center px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition shadow-lg shadow-emerald-700/20"
          >
            Go to Login Page
          </Link>
        </div>
      </div>
    );
  }

  // 4. Registration Form
  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AyurSutra Clinic Staff Onboarding
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
            Complete Staff Self-Registration
          </h1>
          <p className="text-stone-600 text-sm mt-2 max-w-lg mx-auto">
            You have been officially invited to join <strong className="text-stone-800">{invitation.clinicName}</strong>. Please provide your profile information and professional credentials for administrative verification.
          </p>
        </div>

        {/* Invitation Role Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              {invitation.role === "DOCTOR" && <Stethoscope className="w-6 h-6" />}
              {invitation.role === "THERAPIST" && <UserCheck className="w-6 h-6" />}
              {invitation.role === "RECEPTIONIST" && <Building className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-500 uppercase tracking-wider font-medium">Assigned Role:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-800 text-white">
                  {invitation.role}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">Role is locked and clinic-verified via your invitation token.</p>
            </div>
          </div>
          <div className="text-xs text-stone-600 bg-stone-50 px-3 py-2 rounded-lg border border-stone-200 w-full sm:w-auto">
            <div><span className="font-medium text-stone-500">Clinic:</span> {invitation.clinicName}</div>
            <div><span className="font-medium text-stone-500">Email:</span> {invitation.email}</div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
          {formError && (
            <div className="m-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>{formError}</div>
            </div>
          )}

          <div className="p-6 sm:p-8 space-y-8">
            {/* Section 1: Personal Information */}
            <div>
              <h3 className="text-base font-semibold text-stone-900 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-700" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Email Address (Invited)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={invitation.email}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-sm cursor-not-allowed pr-10"
                    />
                    <Lock className="w-4 h-4 text-stone-400 absolute right-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Residential / Residential Address
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, State, Postal code"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Role Specific Professional Information */}
            {invitation.role === "DOCTOR" && (
              <div>
                <h3 className="text-base font-semibold text-stone-900 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-emerald-700" />
                  Professional Medical Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Medical Qualification <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. BAMS, MD (Ayurveda)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Clinical Specialization <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      placeholder="e.g. Panchakarma, Kayachikitsa"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Medical Registration / License No. <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={medicalRegistrationNumber}
                      onChange={(e) => setMedicalRegistrationNumber(e.target.value)}
                      placeholder="e.g. AY-2024-98432"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      State Ayurvedic Council / Licensing Body <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={stateCouncil}
                      onChange={(e) => setStateCouncil(e.target.value)}
                      placeholder="e.g. Maharashtra Board of Ayurvedic & Unani Systems"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Years of Clinical Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                </div>

                {/* Doctor Documents */}
                <div className="mt-6 space-y-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Verification Documents Upload
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Degree Certificate */}
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 transition bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-800">Degree Certificate</span>
                        {degreeCertUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mb-3">BAMS / MD certificate (PDF/Image)</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium cursor-pointer hover:bg-stone-100 transition">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingDoc === "degree" ? "Uploading..." : degreeCertName ? "Replace" : "Choose File"}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "degree", setDegreeCertUrl, setDegreeCertName)}
                        />
                      </label>
                      {degreeCertName && <p className="text-[11px] text-emerald-700 mt-2 truncate font-medium">✓ {degreeCertName}</p>}
                    </div>

                    {/* Registration Certificate */}
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 transition bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-800">Medical Registration Certificate</span>
                        {regCertUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mb-3">State / Central Council License Proof</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium cursor-pointer hover:bg-stone-100 transition">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingDoc === "reg" ? "Uploading..." : regCertName ? "Replace" : "Choose File"}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "reg", setRegCertUrl, setRegCertName)}
                        />
                      </label>
                      {regCertName && <p className="text-[11px] text-emerald-700 mt-2 truncate font-medium">✓ {regCertName}</p>}
                    </div>

                    {/* Additional Certificates */}
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 transition bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-800">Additional Qualifications (Optional)</span>
                        {addCertUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mb-3">Fellowships, superspeciality or training certificates</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium cursor-pointer hover:bg-stone-100 transition">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingDoc === "addCert" ? "Uploading..." : addCertName ? "Replace" : "Choose File"}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "addCert", setAddCertUrl, setAddCertName)}
                        />
                      </label>
                      {addCertName && <p className="text-[11px] text-emerald-700 mt-2 truncate font-medium">✓ {addCertName}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {invitation.role === "THERAPIST" && (
              <div>
                <h3 className="text-base font-semibold text-stone-900 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  Therapist Qualifications & Skills
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Therapy Qualification / Diploma <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      placeholder="e.g. Diploma in Ayurvedic Therapy (DAPT)"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Therapist Rank / Classification
                    </label>
                    <select
                      value={therapistType}
                      onChange={(e) => setTherapistType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm bg-white"
                    >
                      <option value="SENIOR">Senior Panchakarma Therapist</option>
                      <option value="JUNIOR">Junior Panchakarma Therapist</option>
                      <option value="MASSAGE">Ayurvedic Bodywork / Massage Specialist</option>
                      <option value="SPECIALIST">Specialized Treatment Therapist</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Therapy Skills (comma separated)
                    </label>
                    <input
                      type="text"
                      value={therapySkillsInput}
                      onChange={(e) => setTherapySkillsInput(e.target.value)}
                      placeholder="e.g. Abhyanga, Shirodhara, Swedana, Pizhichil, Kizhi, Nasya"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Years of Practical Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">
                      Previous Training / Certifications
                    </label>
                    <input
                      type="text"
                      value={trainingCertifications}
                      onChange={(e) => setTrainingCertifications(e.target.value)}
                      placeholder="e.g. Traditional Kerala Panchakarma Institute"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm"
                    />
                  </div>
                </div>

                {/* Therapist Documents */}
                <div className="mt-6 space-y-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Verification Documents Upload
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 transition bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-800">Qualification Certificate</span>
                        {therapistQualCertUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mb-3">Diploma or degree certificate</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium cursor-pointer hover:bg-stone-100 transition">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingDoc === "thQual" ? "Uploading..." : therapistQualCertName ? "Replace" : "Choose File"}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "thQual", setTherapistQualCertUrl, setTherapistQualCertName)}
                        />
                      </label>
                      {therapistQualCertName && <p className="text-[11px] text-emerald-700 mt-2 truncate font-medium">✓ {therapistQualCertName}</p>}
                    </div>

                    <div className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 transition bg-stone-50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-stone-800">Training Certificate (Optional)</span>
                        {trainingCertUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[11px] text-stone-500 mb-3">Specialized therapy training proof</p>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium cursor-pointer hover:bg-stone-100 transition">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingDoc === "training" ? "Uploading..." : trainingCertName ? "Replace" : "Choose File"}
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "training", setTrainingCertUrl, setTrainingCertName)}
                        />
                      </label>
                      {trainingCertName && <p className="text-[11px] text-emerald-700 mt-2 truncate font-medium">✓ {trainingCertName}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {invitation.role === "RECEPTIONIST" && (
              <div>
                <h3 className="text-base font-semibold text-stone-900 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  Supporting Information & ID Proof
                </h3>
                <div className="p-4 rounded-xl border border-dashed border-stone-300 hover:border-emerald-500 transition bg-stone-50 max-w-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-stone-800">Identity Document / Resume (Optional)</span>
                    {idProofUrl && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mb-3">Government ID or employment proof (PDF/Image)</p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-700 text-xs font-medium cursor-pointer hover:bg-stone-100 transition">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingDoc === "idProof" ? "Uploading..." : idProofName ? "Replace" : "Choose File"}
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "idProof", setIdProofUrl, setIdProofName)}
                    />
                  </label>
                  {idProofName && <p className="text-[11px] text-emerald-700 mt-2 truncate font-medium">✓ {idProofName}</p>}
                </div>
              </div>
            )}

            {/* Section 3: Account Security */}
            <div>
              <h3 className="text-base font-semibold text-stone-900 border-b border-stone-200 pb-2 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-700" />
                Set Account Password
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Confirm Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-stone-400 hover:text-stone-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-stone-500">
              By submitting, your account enters <strong className="text-stone-700">Pending Verification</strong>.
            </p>
            <button
              type="submit"
              disabled={submitting || !!uploadingDoc}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-medium text-sm transition shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Registration...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Submit Registration for Review
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
