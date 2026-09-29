"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/store/session";
import { isValidEmailFormat, loginUser, signUpUser } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const performAuth = async () => {
    setErrorMsg(null);
    const cleanEmail = email.trim().toLowerCase();

    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Your full name is required for a new account.");
      return;
    }
    if (!isValidEmailFormat(cleanEmail)) {
      setErrorMsg("Invalid email address. Fake or malformed email formats are blocked. Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg("Password is required and must be at least 4 characters long.");
      return;
    }

    setLoading(true);
    try {
      const response = mode === "signup"
        ? await signUpUser(name.trim(), cleanEmail, password, role)
        : await loginUser(cleanEmail, password, role);

      if (response.success && response.user) {
        login(response.user.name, response.user.email, response.user.role);
        router.push(response.user.role === "student" ? "/student" : "/teacher/dashboard");
      }
    } catch (error: unknown) {
      setErrorMsg(error instanceof Error ? error.message : "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (selectedRole: "student" | "teacher") => {
    setMode("signin");
    setRole(selectedRole);
    setEmail(selectedRole === "student" ? "student@mendmind.edu" : "teacher@mendmind.edu");
    setPassword("password123");
    window.setTimeout(() => {
      const cleanEmail = selectedRole === "student" ? "student@mendmind.edu" : "teacher@mendmind.edu";
      setLoading(true);
      loginUser(cleanEmail, "password123", selectedRole)
        .then((response) => {
          login(response.user.name, response.user.email, response.user.role);
          router.push(response.user.role === "student" ? "/student" : "/teacher/dashboard");
        })
        .catch((error: unknown) => setErrorMsg(error instanceof Error ? error.message : "Authentication failed."))
        .finally(() => setLoading(false));
    }, 0);
  };

  return (
    <section className="reason-auth">
      <div className="reason-auth-grid">
        <div className="reason-auth-copy">
          <div className="reason-eyebrow">{mode === "signup" ? "STEP BY STEP REGISTRATION" : "WELCOME BACK 👋"}</div>
          <h1>{mode === "signup" ? <>Create Your<br /><span className="reason-gradient">Reason X Account</span></> : <>Log in to<br /><span className="reason-gradient">Reason X</span></>}</h1>
          <p>{mode === "signup" ? "Join thousands of learners and start your learning journey with AI." : "Continue your learning journey with your personal AI assistant."}</p>
          <div className="reason-list">
            <div className="reason-list-item"><div className="reason-list-icon">📖</div><div><b>Learn Smarter</b><br /><span>Personalized learning with AI assistance</span></div></div>
            <div className="reason-list-item"><div className="reason-list-icon">💡</div><div><b>Practice Better</b><br /><span>Solve problems and take quizzes</span></div></div>
            <div className="reason-list-item"><div className="reason-list-icon">📊</div><div><b>Track Progress</b><br /><span>Monitor your growth and achievements</span></div></div>
            <div className="reason-list-item"><div className="reason-list-icon">👥</div><div><b>Be Future Ready</b><br /><span>AI powered learning for a brighter future</span></div></div>
          </div>
        </div>

        <div className="reason-card">
          <div className="reason-big-icon">👤</div>
          <h2>{mode === "signup" ? "Sign Up" : "Welcome Back"}</h2>
          <p>{mode === "signup" ? "Create a new account to get started" : "Log in to your Reason X account"}</p>

          <div className="reason-auth-tabs">
            <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setErrorMsg(null); }}>Log In</button>
            <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setErrorMsg(null); }}>Sign Up</button>
          </div>

          <div className="reason-role" role="radiogroup" aria-label="Account role">
            <label><input type="radio" checked={role === "student"} onChange={() => setRole("student")} /> Student</label>
            <label><input type="radio" checked={role === "teacher"} onChange={() => setRole("teacher")} /> Teacher</label>
          </div>

          {errorMsg && <div className="reason-error" role="alert"><strong>Authentication Blocked</strong><br />{errorMsg}</div>}

          <form onSubmit={(event) => { event.preventDefault(); void performAuth(); }}>
            {mode === "signup" && <div className="reason-field"><label htmlFor="name">Full Name</label><input id="name" value={name} onChange={(event) => { setName(event.target.value); setErrorMsg(null); }} placeholder="Enter your full name" autoComplete="name" /></div>}
            <div className="reason-field"><label htmlFor="email">Email Address</label><input id="email" type="email" value={email} onChange={(event) => { setEmail(event.target.value); setErrorMsg(null); }} placeholder="Enter your email" autoComplete="email" /></div>
            <div className="reason-field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(event) => { setPassword(event.target.value); setErrorMsg(null); }} placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></div>
            {mode === "signin" && <button type="button" className="forgot" onClick={() => setErrorMsg("Password recovery is not configured yet. Please contact an administrator.")}>Forgot Password?</button>}
            <button type="submit" className="reason-btn" disabled={loading}>{loading ? "Please wait..." : mode === "signup" ? "Sign Up →" : "Log In →"}</button>
          </form>

          <div className="reason-demo">
            <div>Demo accounts</div>
            <button type="button" onClick={() => handleQuickLogin("student")}>Student demo</button> · <button type="button" onClick={() => handleQuickLogin("teacher")}>Teacher demo</button>
          </div>
          <div className="bottom">{mode === "signin" ? "Don't have an account? " : "Already have an account? "}<b onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErrorMsg(null); }}>{mode === "signin" ? "Sign Up" : "Sign In"}</b></div>
          <Link href="/" className="sr-only">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
