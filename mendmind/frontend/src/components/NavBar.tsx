"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import { BookOpenIcon, TrendingUpIcon, UsersIcon, TargetIcon } from "@/components/Icons";

export default function NavBar() {
  const path = usePathname();
  const { user, logout } = useSession();
  const navItems = user?.role === "teacher"
    ? [
        { href: "/teacher/home", label: "Home", icon: TargetIcon },
        { href: "/teacher/dashboard", label: "Teacher Dashboard", icon: UsersIcon },
      ]
    : [
          { href: "/student", label: "Dashboard", icon: TargetIcon },
          { href: "/student/learnings", label: "My Learnings", icon: BookOpenIcon },
      ];

  return (
    <header className="reason-top">
      <div className="reason-top-inner">
        <Link href={user ? "/" : "/login"} className="reason-logo">Reason <i>x</i></Link>

        <nav className="reason-nav" aria-label="Primary navigation">
          <Link href="/#features">Features</Link>
          <Link href="/#how-it-works">How It Works</Link>
          <Link href="/#about">About</Link>
          <Link href="/#contact">Contact</Link>
        </nav>

        {user ? (
          <button onClick={logout} className="reason-btn reason-btn-small">Log Out</button>
        ) : (
          <Link href="/login" className="reason-btn reason-btn-small">Login</Link>
        )}
      </div>
      {path !== "/" && user && (
        <div className="reason-product-nav">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={(href === "/student" ? path === href : path === href || path.startsWith(`${href}/`)) ? "active" : ""}
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
