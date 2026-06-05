'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { User, LogOut, ArrowUpRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOutUser();
      toast.success('Signed out successfully');
      router.push('/');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Explore', href: '/explore' },
    { name: 'Solar System', href: '/star/solar-system' },
    { name: 'Black Holes', href: '/blackholes' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4 w-full">
      <div
        className={cn(
          "inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface px-1.5 sm:px-2 py-1.5 sm:py-2 transition-shadow duration-300 max-w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          scrolled && "shadow-md shadow-black/40"
        )}
      >
        {/* Logo */}
        <Link href="/" className="group shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full accent-gradient p-[1px] transition-transform duration-300 hover:scale-110 ml-1">
          <div className="w-full h-full bg-bg rounded-full flex items-center justify-center">
            <span className="font-display italic text-[11px] sm:text-[13px] text-text-primary">AL</span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block shrink-0 w-px h-5 bg-stroke mx-2 sm:mx-3" />

        {/* Nav Links */}
        <div className="flex items-center gap-0.5 sm:gap-2 ml-2 sm:ml-0">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-[11px] sm:text-sm rounded-full px-2.5 sm:px-4 py-1.5 sm:py-2 transition-colors whitespace-nowrap shrink-0",
                  isActive 
                    ? "text-text-primary bg-stroke/50" 
                    : "text-muted hover:text-text-primary hover:bg-stroke/50"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="shrink-0 w-px h-4 sm:h-5 bg-stroke mx-2 sm:mx-3" />

        {/* CTA */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 pr-1">
          {user ? (
            <>
              <Link href="/dashboard" className="group relative inline-flex text-[11px] sm:text-sm rounded-full shrink-0">
                <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-surface rounded-full backdrop-blur-md text-text-primary transition-colors group-hover:bg-bg/80 whitespace-nowrap">
                  <User size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>My Space</span>
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-muted hover:text-text-primary p-1.5 sm:p-2 transition-colors rounded-full hover:bg-stroke/50 shrink-0"
                aria-label="Sign out"
              >
                <LogOut size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="group relative inline-flex text-[11px] sm:text-sm rounded-full shrink-0">
              <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-1 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-surface rounded-full backdrop-blur-md text-text-primary transition-colors group-hover:bg-bg/80 whitespace-nowrap">
                <span>Sign In</span>
                <ArrowUpRight size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
