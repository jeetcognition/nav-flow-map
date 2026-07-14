# 20 — Auth (Login → Landing)

Flow: authentication between the Login page and the Landing search page (org selector). Email + OTP.

| ID | Type | Pri | How to reach | Steps | Expected |
|---|---|---|---|---|---|
| AUTH-SAN01 | Sanity | P0 | On the Login page | Enter a valid work email and click Continue | The OTP entry step is shown, stating a verification code was sent to the entered email. |
| AUTH-SAN02 | Sanity | P0 | On the OTP step | Enter the valid OTP code from the email and submit | Login succeeds and the user lands on the Landing search page ("Choose an organization to continue"). |
| AUTH-SAN03 | Sanity | P1 | After a successful login | Reload the browser tab | The session persists: the Landing search page loads again without asking for email/OTP. |
| AUTH-SAN04 | Sanity | P1 | On the OTP step | Inspect the resend option | A "resend code" control is visible; clicking it confirms a new code was sent. |
| AUTH-REG01 | Regression | P0 | On the OTP step | Enter a wrong OTP code and submit | The code is rejected with a clear error; the user stays on the OTP step and is NOT logged in. |
| AUTH-REG02 | Regression | P1 | On the OTP step | Wait for the code to expire (or use an old code) and submit | The expired code is rejected with a clear error; requesting a fresh code allows login. |
| AUTH-REG03 | Regression | P1 | While logged out | Open a protected route directly (e.g. the org selector or a settings URL) | The user is redirected to the Login page, not shown any protected content. |
| AUTH-REG04 | Regression | P1 | After a successful login | Log out from the account menu | The session ends and the user is returned to the Login page; going Back does not restore protected content. |
| AUTH-REG05 | Regression | P0 | On the OTP step | Inspect the URL, UI, and browser console during the whole email → OTP → success flow | No OTP codes, tokens, or sensitive session data are exposed in the URL, page source, or console. |
