// Email → OTP → dashboard. Mock flow (see lib/auth.ts): the code is shown
// as a dev hint instead of being emailed until a real backend exists.
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { EnvelopeSimple, Flask, ShieldCheck } from "@phosphor-icons/react";
import { sendOtp, setAuthed, validEmail } from "../lib/auth";
import { EASE } from "../lib/motion";
import "../styles/login.css";

type Step = "email" | "otp";

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [expected, setExpected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const submitEmail = async () => {
    const addr = email.trim();
    if (!validEmail(addr)) {
      setError("Enter a valid work email address.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const otp = await sendOtp(addr);
      setExpected(otp);
      setStep("otp");
      setTimeout(() => otpRef.current?.focus(), 50);
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = () => {
    if (code.trim() !== expected) {
      setError("That code doesn't match — check the 6-digit code and try again.");
      return;
    }
    setAuthed(email.trim());
    navigate("/", { replace: true });
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE }}
      >
        <div className="login-brand">
          <span className="login-logo" aria-hidden>
            <Flask size={22} weight="duotone" />
          </span>
          <h1>QA Command Center</h1>
          <p className="login-sub">Sign in with your work email</p>
        </div>

        {step === "email" ? (
          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              void submitEmail();
            }}
          >
            <label className="login-label" htmlFor="login-email">
              Work email
            </label>
            <div className="login-input-row">
              <EnvelopeSimple size={16} className="login-input-icon" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary login-btn" type="submit" disabled={busy}>
              {busy ? "Sending code…" : "Continue"}
            </button>
          </form>
        ) : (
          <form
            className="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitOtp();
            }}
          >
            <p className="login-otp-note">
              <ShieldCheck size={15} weight="duotone" /> We sent a 6-digit code to{" "}
              <b>{email.trim()}</b>
            </p>
            <p className="login-mock-hint mono" title="Shown because there is no email backend yet">
              mock delivery — your code is {expected}
            </p>
            <label className="login-label" htmlFor="login-otp">
              One-time code
            </label>
            <input
              id="login-otp"
              ref={otpRef}
              className="login-otp-input mono"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="btn btn-primary login-btn"
              type="submit"
              disabled={code.length !== 6}
            >
              Verify &amp; sign in
            </button>
            <button
              className="login-back"
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
            >
              Use a different email
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
