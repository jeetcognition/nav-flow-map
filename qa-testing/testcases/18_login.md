# 18 — Login

Page: tenant `/login`, which redirects to the hosted authentication page.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| LOGIN-SAN01 | Sanity | P1 | Open the tenant `/login` route | Load the Login page | The Devin logo, Welcome heading, tenant description, work email field, and Continue button are visible and readable. |
| LOGIN-SAN02 | Sanity | P1 | On the Login page | Inspect the available login methods | The work email field and at least the GitHub and Google login buttons are visible with the correct icons and labels. |
| LOGIN-SAN03 | Sanity | P2 | On the Login page | Inspect the account registration prompt | "Don't have an account? Sign up" is visible and readable. |
| LOGIN-REG01 | Regression | P1 | On the Login page | Click the Sign up link | The URL contains `/signup/`, and "Already have an account? Log in" is visible and readable. |
| LOGIN-REG02 | Regression | P1 | On the Login page | Submit each invalid email value separately: `abc`, `a@`, and spaces only | Each invalid email is rejected with clear validation, and the user remains on the Login page. |
| LOGIN-REG03 | Regression | P0 | On the Login page | Inspect the URL, visible UI, and browser console before and after submitting an invalid email | No credentials, OTPs, sensitive tokens, or internal error details appear in the URL, UI, or browser console. |
