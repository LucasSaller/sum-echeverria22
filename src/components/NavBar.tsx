"use client";

import { signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import ThemeToggle from "./ThemeToggle";

interface NavBarProps {
  session: Session | null;
  isAdmin?: boolean;
}

export default function NavBar({ session, isAdmin }: NavBarProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
            SUM
          </span>
          <span className="text-xs font-normal text-stone-400 dark:text-stone-500 uppercase tracking-widest">
            Echeverría
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/reporte"
              className="text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Reporte
            </Link>
          )}
          {session?.user ? (
            <>
              {/* User info */}
              <div className="hidden sm:flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full ring-2 ring-stone-200 dark:ring-stone-700"
                  />
                )}
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  {session.user.name?.split(" ")[0]}
                </span>
              </div>

              <ThemeToggle />

              {/* Logout */}
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 border border-transparent hover:border-red-200 dark:hover:border-red-800"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Salir
              </button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-colors shadow-sm"
              >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="hidden sm:inline">Iniciar sesión con Google</span>
              <span className="sm:hidden">Iniciar sesión</span>
            </button>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
