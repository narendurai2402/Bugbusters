"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/store/session";
import { BookOpenIcon, TrendingUpIcon, UsersIcon, UserIcon } from "@/components/Icons";

const navItems = [
  { href: "/student/practice", label: "Practice Canvas", icon: BookOpenIcon },
  { href: "/student/progress", label: "My Progress", icon: TrendingUpIcon },
  { href: "/teacher/dashboard", label: "Teacher Dashboard", icon: UsersIcon },
];

export default function NavBar() {
  const path = usePathname();
  const { user, logout } = useSession();
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

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
            <Link key={href} href={href} className={path === href ? "active" : ""}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
