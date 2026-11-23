// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../../app/lib/hooks/useAuth";
import { MobileBottomNav } from "../navigation/MobileBottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
        <MobileBottomNav />
      </AuthProvider>
    </SessionProvider>
  );
}
