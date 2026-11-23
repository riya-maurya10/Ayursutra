import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  Mail,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Check,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [forgotMessage, setForgotMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Resend Countdown Timer
  useEffect(() => {
    let timer: any;
    if (showForgotModal && forgotStep === 2 && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showForgotModal, forgotStep, resendCountdown]);

  // STEP 1: Request OTP
  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotMessage({ type: "error", text: "Please enter your registered email address." });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setForgotMessage({ type: "error", text: "Please enter a valid email format." });
      return;
    }

    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const res = await apiClient.post("/auth/forgot-password", { email: trimmedEmail });
      // Generic success message that does not expose OTP or reveal account existence
      setForgotMessage({
        type: "success",
        text:
          res.data?.message ||
          "If an account is associated with this email, a 6-digit verification code has been sent. Please check your inbox.",
      });
      setOtpCode(""); // Never prefilled
      setResendCountdown(60);
      setForgotStep(2);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        (err?.message === "Network Error" || !err?.response
          ? "Unable to connect to server. Please try again later."
          : "Unable to process password reset request. Please try again.");
      setForgotMessage({ type: "error", text: errMsg });
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || forgotLoading) return;
    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) return;

    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const res = await apiClient.post("/auth/forgot-password", { email: trimmedEmail });
      setForgotMessage({
        type: "success",
        text: res.data?.message || "A new 6-digit verification code has been dispatched to your email.",
      });
      setResendCountdown(60);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        "Failed to resend verification code. Please wait and try again.";
      setForgotMessage({ type: "error", text: errMsg });
    } finally {
      setForgotLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();
    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setForgotMessage({ type: "error", text: "Please enter a valid 6-digit verification code." });
      return;
    }

    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const res = await apiClient.post("/auth/verify-otp", {
        email: forgotEmail.trim(),
        otp: cleanOtp,
      });
      setForgotMessage({
        type: "success",
        text: res.data?.message || "Verification code confirmed! Now create your new password.",
      });
      setForgotStep(3);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        (err?.message === "Network Error" || !err?.response
          ? "Unable to connect to server. Please try again later."
          : "Invalid or expired verification code. Please check and try again.");
      setForgotMessage({ type: "error", text: errMsg });
    } finally {
      setForgotLoading(false);
    }
  };

  // STEP 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setForgotMessage({
        type: "error",
        text: "New password must be at least 6 characters long.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotMessage({
        type: "error",
        text: "Passwords do not match. Please ensure both fields are identical.",
      });
      return;
    }

    setForgotLoading(true);
    setForgotMessage(null);

    try {
      const res = await apiClient.post("/auth/reset-password", {
        email: forgotEmail.trim(),
        token: otpCode.trim(),
        newPassword: newPassword,
      });

      setForgotMessage({
        type: "success",
        text: res.data?.message || "Password reset successfully! Redirecting to login...",
      });

      // Update login email input and clear password for immediate login
      setEmail(forgotEmail.trim());
      setPassword("");

      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setForgotMessage(null);
        setNewPassword("");
        setConfirmPassword("");
        setOtpCode("");
      }, 2000);
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        (err?.message === "Network Error" || !err?.response
          ? "Unable to connect to server. Please try again later."
          : "Failed to reset password. The reset session may have expired.");
      setForgotMessage({ type: "error", text: errMsg });
    } finally {
      setForgotLoading(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-gray-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 3) return { score: 2, label: "Moderate", color: "bg-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-600" };
  };

  const strength = getPasswordStrength(newPassword);

  const getDashboardPath = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "/admin";
      case "DOCTOR":
        return "/doctor";
      case "THERAPIST":
        return "/therapist";
      case "RECEPTIONIST":
        return "/receptionist";
      case "PATIENT":
        return "/patient";
      default:
        return "/unauthorized";
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getDashboardPath(user.role), {
        replace: true,
      });
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await login({
        email: email.trim(),
        password,
      });

      navigate(getDashboardPath(data.role), {
        replace: true,
      });
    } catch (error: any) {
      console.error("Login failed:", error);
      const backendMessage = error?.response?.data?.message;
      if (error?.message === "Network Error" || !error?.response) {
        setMessage(
          "Unable to connect to authentication server. Please check your network connection."
        );
      } else {
        setMessage(
          backendMessage ||
            "Login failed. Please check your email and password."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* =====================================================
          BACKGROUND IMAGE
          ===================================================== */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/ayurvedic-login-bg.png')",
        }}
      />

      {/* =====================================================
          SOFT OVERLAY
          ===================================================== */}
      <div className="absolute inset-0 bg-[#173D2D]/10" />

      {/* =====================================================
          BACK TO HOME
          ===================================================== */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="
          absolute
          left-8
          top-8
          z-20
          inline-flex
          items-center
          gap-2
          text-sm
          font-medium
          text-[#173D2D]
          transition
          duration-200
          hover:text-[#6B7F4E]
        "
      >
        <span className="text-lg leading-none">←</span>
        Back to Home
      </button>

      {/* =====================================================
          MAIN CONTENT
          ===================================================== */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-20">
        {/* ===================================================
            LOGIN CARD
            =================================================== */}
        <div
          className="
            w-full
            max-w-md
            rounded-3xl
            border
            border-white/70
            bg-[#FFFDF8]/95
            p-8
            shadow-2xl
            backdrop-blur-md
            sm:p-10
          "
        >
          {/* BRAND */}
          <div className="mb-7">
            <p
              className="
                mb-2
                text-sm
                font-medium
                uppercase
                tracking-[0.25em]
                text-[#71834F]
              "
            >
              AyurSutra
            </p>

            <h1
              className="
                mb-2
                text-4xl
                font-semibold
                tracking-tight
                text-[#173D2D]
              "
            >
              Welcome Back
            </h1>

            <p className="text-[#5A4A3A]">
              Continue your Ayurvedic care journey.
            </p>
          </div>

          {/* =================================================
              LOGIN FORM
              ================================================= */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#173D2D]
                "
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="Enter your email"
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#B8C4B4]
                  bg-white
                  px-4
                  py-3
                  text-[#173D2D]
                  placeholder:text-[#9AA49C]
                  outline-none
                  transition
                  duration-200
                  focus:border-[#71834F]
                  focus:ring-2
                  focus:ring-[#71834F]/20
                "
              />
              {/* NOTE: Duplicate Forgot Password link removed from below Email field */}
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-[#173D2D]
                "
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Enter your password"
                className="
                  w-full
                  rounded-xl
                  border
                  border-[#B8C4B4]
                  bg-white
                  px-4
                  py-3
                  text-[#173D2D]
                  placeholder:text-[#9AA49C]
                  outline-none
                  transition
                  duration-200
                  focus:border-[#71834F]
                  focus:ring-2
                  focus:ring-[#71834F]/20
                "
              />

              {/* SINGLE FORGOT PASSWORD LINK (BELOW PASSWORD, RIGHT-ALIGNED) */}
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setOtpCode("");
                    setForgotMessage(null);
                    setForgotStep(1);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-medium text-[#71834F] hover:text-[#173D2D] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                rounded-xl
                bg-[#173D2D]
                px-4
                py-3.5
                font-semibold
                text-white
                shadow-sm
                transition
                duration-200
                hover:bg-[#24533F]
                hover:shadow-md
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* =================================================
              ERROR MESSAGE
              ================================================= */}
          {message && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-[#E4C8C2]
                bg-[#FBF1EE]
                px-4
                py-3
                text-center
                text-sm
                text-[#8A4A3C]
              "
            >
              {message}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================
          FORGOT PASSWORD 3-STEP MODAL
          ===================================================== */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#D5DDD2] bg-white p-6 md:p-8 shadow-2xl transition-all">
            {/* CLOSE BUTTON */}
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotMessage(null);
                setOtpCode("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F6F2] text-[#556353] hover:bg-[#E2E8DE] transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>

            {/* HEADER */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E7] text-[#356B4B]">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#173D2D]">
                  {forgotStep === 1 && "Reset Your Password"}
                  {forgotStep === 2 && "Enter Verification Code"}
                  {forgotStep === 3 && "Set New Password"}
                </h3>
                <p className="text-xs text-[#7A8A78]">
                  {forgotStep === 1 && "Enter your registered email to receive an OTP code"}
                  {forgotStep === 2 && "Check your inbox for the 6-digit verification code"}
                  {forgotStep === 3 && "Create a secure new password for your account"}
                </p>
              </div>
            </div>

            {/* STEP PROGRESS INDICATOR */}
            <div className="mt-5 mb-2 flex items-center justify-between px-2">
              {/* Step 1 Circle */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    forgotStep === 1
                      ? "bg-[#173D2D] text-white shadow-sm"
                      : "bg-[#EAF1E7] text-[#24533F]"
                  }`}
                >
                  {forgotStep > 1 ? <Check size={14} /> : "1"}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    forgotStep === 1 ? "text-[#173D2D]" : "text-[#7A8A78]"
                  }`}
                >
                  Email
                </span>
              </div>

              {/* Line 1 */}
              <div
                className={`h-0.5 flex-1 mx-2 transition-all ${
                  forgotStep > 1 ? "bg-[#356B4B]" : "bg-[#E2E8DE]"
                }`}
              />

              {/* Step 2 Circle */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    forgotStep === 2
                      ? "bg-[#173D2D] text-white shadow-sm"
                      : forgotStep > 2
                      ? "bg-[#EAF1E7] text-[#24533F]"
                      : "bg-[#F4F6F2] text-[#8A9A88]"
                  }`}
                >
                  {forgotStep > 2 ? <Check size={14} /> : "2"}
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    forgotStep === 2 ? "text-[#173D2D]" : "text-[#7A8A78]"
                  }`}
                >
                  Verify
                </span>
              </div>

              {/* Line 2 */}
              <div
                className={`h-0.5 flex-1 mx-2 transition-all ${
                  forgotStep > 2 ? "bg-[#356B4B]" : "bg-[#E2E8DE]"
                }`}
              />

              {/* Step 3 Circle */}
              <div className="flex items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    forgotStep === 3
                      ? "bg-[#173D2D] text-white shadow-sm"
                      : "bg-[#F4F6F2] text-[#8A9A88]"
                  }`}
                >
                  3
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    forgotStep === 3 ? "text-[#173D2D]" : "text-[#7A8A78]"
                  }`}
                >
                  Password
                </span>
              </div>
            </div>

            {/* ALERT NOTIFICATION */}
            {forgotMessage && (
              <div
                className={`mt-4 rounded-xl border p-3.5 text-xs flex items-start gap-2.5 ${
                  forgotMessage.type === "success"
                    ? "border-[#B5D6B2] bg-[#EFF8EE] text-[#2D5A27]"
                    : "border-[#E4C8C2] bg-[#FBF1EE] text-[#8A4A3C]"
                }`}
              >
                {forgotMessage.type === "success" ? (
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-[#356B4B]" />
                ) : (
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-[#8A4A3C]" />
                )}
                <div className="leading-relaxed font-medium">{forgotMessage.text}</div>
              </div>
            )}

            {/* =====================================================
                STEP 1: ENTER EMAIL
                ===================================================== */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestResetToken} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4E5C4B] mb-1.5">
                    Registered Email
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A88]"
                    />
                    <input
                      type="email"
                      required
                      placeholder="e.g. user@ayursutra.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#C5D2C2] bg-white pl-10 pr-4 py-3 text-sm text-[#173D2D] outline-none transition focus:border-[#4B7355] focus:ring-2 focus:ring-[#4B7355]/20"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#7A8A78]">
                    We'll dispatch a 6-digit verification code if the email is registered.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#173D2D] px-4 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#24533F] transition-all disabled:opacity-50"
                >
                  {forgotLoading ? "Generating Code..." : "Generate Reset Code"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* =====================================================
                STEP 2: ENTER OTP
                ===================================================== */}
            {forgotStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#4E5C4B]">
                      6-Digit Verification Code
                    </label>
                    <span className="text-[11px] text-[#7A8A78]">Valid for 5 mins</span>
                  </div>

                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtpCode(val);
                    }}
                    className="w-full tracking-[0.4em] text-center font-mono font-bold rounded-xl border border-[#C5D2C2] bg-[#FAFBF9] px-4 py-3 text-xl text-[#173D2D] outline-none focus:border-[#4B7355] focus:ring-2 focus:ring-[#4B7355]/20 placeholder:text-gray-300"
                  />
                  <p className="mt-1 text-center text-[11px] text-[#7A8A78]">
                    Sent to: <span className="font-semibold text-[#173D2D]">{forgotEmail}</span>
                  </p>
                </div>

                {/* RESEND OTP WITH COUNTDOWN */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotMessage(null);
                    }}
                    className="text-[#7A8A78] hover:text-[#173D2D] underline"
                  >
                    Change Email
                  </button>

                  <button
                    type="button"
                    disabled={resendCountdown > 0 || forgotLoading}
                    onClick={handleResendOtp}
                    className="inline-flex items-center gap-1 font-semibold text-[#356B4B] hover:text-[#173D2D] disabled:text-[#9AA49C] disabled:cursor-not-allowed transition-colors"
                  >
                    <RefreshCw size={13} className={forgotLoading ? "animate-spin" : ""} />
                    {resendCountdown > 0
                      ? `Resend Code in ${resendCountdown}s`
                      : "Resend Code"}
                  </button>
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setForgotMessage(null);
                    }}
                    className="w-1/3 rounded-xl border border-[#D5DDD2] bg-[#F7F9F6] px-3 py-2.5 text-xs font-semibold text-[#546252] hover:bg-[#EAEFE8] transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading || otpCode.trim().length !== 6}
                    className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-[#173D2D] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#24533F] transition disabled:opacity-50"
                  >
                    <ShieldCheck size={16} />
                    {forgotLoading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            )}

            {/* =====================================================
                STEP 3: SET NEW PASSWORD
                ===================================================== */}
            {forgotStep === 3 && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                {/* NEW PASSWORD */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4E5C4B] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A88]"
                    />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#C5D2C2] bg-white pl-10 pr-11 py-2.5 text-sm text-[#173D2D] outline-none focus:border-[#4B7355] focus:ring-2 focus:ring-[#4B7355]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9A88] hover:text-[#173D2D]"
                      title={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* STRENGTH INDICATOR */}
                  {newPassword && (
                    <div className="mt-2 space-y-1">
                      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${(strength.score / 3) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#7A8A78]">
                        <span>Strength: {strength.label}</span>
                        <span>{newPassword.length >= 6 ? "✓ Min length met" : "Min 6 chars"}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* CONFIRM NEW PASSWORD */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#4E5C4B] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A88]"
                    />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-[#C5D2C2] bg-white pl-10 pr-11 py-2.5 text-sm text-[#173D2D] outline-none focus:border-[#4B7355] focus:ring-2 focus:ring-[#4B7355]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A9A88] hover:text-[#173D2D]"
                      title={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* MATCH INDICATOR */}
                  {confirmPassword && (
                    <p
                      className={`mt-1 text-[11px] font-medium ${
                        newPassword === confirmPassword ? "text-emerald-700" : "text-rose-600"
                      }`}
                    >
                      {newPassword === confirmPassword
                        ? "✓ Passwords match"
                        : "✗ Passwords do not match"}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(2);
                      setForgotMessage(null);
                    }}
                    className="w-1/3 rounded-xl border border-[#D5DDD2] bg-[#F7F9F6] px-3 py-2.5 text-xs font-semibold text-[#546252] hover:bg-[#EAEFE8] transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={
                      forgotLoading ||
                      newPassword.length < 6 ||
                      newPassword !== confirmPassword
                    }
                    className="w-2/3 flex items-center justify-center gap-2 rounded-xl bg-[#173D2D] px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-[#24533F] transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    {forgotLoading ? "Resetting..." : "Save New Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
