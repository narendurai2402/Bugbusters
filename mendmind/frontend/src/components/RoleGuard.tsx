"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/store/session";
import { useSession } from "@/store/session";

export default function RoleGuard({
  role,
  children,
}: {
  role: UserProfile["role"];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useSession((state) => state.user);

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      router.replace(user.role === "teacher" ? "/teacher/home" : "/student");
    }
  }, [role, router, user]);

  if (!user || user.role !== role) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-sm font-semibold text-slate-400" role="status">
        Checking your access...
      </div>
    );
  }

  return children;
}
