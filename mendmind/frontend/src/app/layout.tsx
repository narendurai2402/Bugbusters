import "./globals.css";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import NavBar from "@/components/NavBar";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Reason x — Adaptive Socratic Tutor & Misconception Repair",
  description: "AI-driven adaptive learning tutor that diagnoses core mathematical misconceptions and builds mastery through targeted Socratic interventions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="min-h-screen bg-[#f7f8ff] text-[#0c1230] font-sans antialiased selection:bg-[#6535f5] selection:text-white relative overflow-x-hidden">
        <div className="flex min-h-screen flex-col">
          <NavBar />
          <main className="flex-1 w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
