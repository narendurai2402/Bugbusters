# Reason X - Connected 8-Page Frontend

## Flow
index.html
  -> signup.html
  -> role-selection.html
  -> email-verification.html
  -> login.html
  -> role-based dashboard
      student -> student-dashboard.html -> ai-tutor.html
      teacher -> teacher-dashboard.html

## Auth behavior
- Selected role is stored as `reasonXRole`.
- Successful login sets `reasonXLoggedIn=true`.
- Student dashboard and AI Tutor require a logged-in student.
- Teacher dashboard requires a logged-in teacher.
- Logout clears the login session and returns to login.html.
- Direct access to protected pages redirects to login or the correct role dashboard.

## Notes
This is frontend/demo authentication using localStorage. It is not a replacement for server-side authentication in production.
