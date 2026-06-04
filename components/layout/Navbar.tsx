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
    { name: 'Black Holes', href: '/blackholes' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 md:pt-6 px-4">
      <div
        className={cn(
          "inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface px-2 py-2 transition-shadow duration-300",
          scrolled && "shadow-md shadow-black/40"
        )}
      >
        {/* Logo */}
        <Link href="/" className="group flex items-center justify-center w-9 h-9 rounded-full accent-gradient p-[1px] transition-transform duration-300 hover:scale-110">
          <div className="w-full h-full bg-bg rounded-full flex items-center justify-center">
            <span className="font-display italic text-[13px] text-text-primary">AL</span>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-stroke mx-3" />

        {/* Nav Links */}
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "text-xs sm:text-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 transition-colors",
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
        <div className="w-px h-5 bg-stroke mx-3" />

        {/* CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href="/dashboard" className="group relative inline-flex text-xs sm:text-sm rounded-full">
                <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface rounded-full backdrop-blur-md text-text-primary transition-colors group-hover:bg-bg/80">
                  <User size={14} />
                  <span>My Space</span>
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="text-muted hover:text-text-primary p-2 transition-colors rounded-full hover:bg-stroke/50"
                aria-label="Sign out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="group relative inline-flex text-xs sm:text-sm rounded-full">
              <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-surface rounded-full backdrop-blur-md text-text-primary transition-colors group-hover:bg-bg/80">
                <span>Sign In</span>
                <ArrowUpRight size={14} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
