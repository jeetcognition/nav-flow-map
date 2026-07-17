// Mock auth for Phase 1 — no real email/OTP backend yet. The login page
// generates the code client-side and shows it as a dev hint; swap sendOtp/
// verifyOtp for real API calls later. Session persists in localStorage.
import { readStorage, writeStorage } from "./storage";

const AUTH_KEY = "qa-auth-v1";

export function isAuthed(): boolean {
  return Boolean(readStorage(AUTH_KEY));
}

export function authedEmail(): string | null {
  return readStorage(AUTH_KEY);
}

export function setAuthed(email: string) {
  writeStorage(AUTH_KEY, email);
}

export function clearAuth() {
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {
    // storage unavailable — nothing to clear
  }
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Mock OTP delivery: returns the code that "was emailed". */
export function sendOtp(_email: string): Promise<string> {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  return new Promise((res) => setTimeout(() => res(code), 700));
}
