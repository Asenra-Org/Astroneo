'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { User, LogOut, ArrowUpRight, Menu, X } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    { name: 'Explore', href: '/explore' },
    { name: 'About Us', href: '/about' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col items-center pt-4 md:pt-6 px-4 w-full">
      <div className="relative w-full max-w-5xl flex flex-col items-center">
        {/* Desktop Navbar - hidden on mobile, flex on md and up */}
        <div
          className={cn(
            "hidden md:inline-flex items-center rounded-full backdrop-blur-md border border-white/10 bg-surface px-1.5 sm:px-2 py-1.5 sm:py-2 transition-shadow duration-300 max-w-full",
            scrolled && "shadow-md shadow-black/40"
          )}
        >
          <Link href="/" className="group shrink-0 flex items-center justify-center h-8 sm:h-9 rounded-full accent-gradient p-[1px] transition-transform duration-300 hover:scale-110 ml-1">
            <div className="w-full h-full bg-bg rounded-full flex items-center justify-center px-3 sm:px-4">
              <span className="font-display font-medium text-[11px] sm:text-[13px] text-text-primary">Home</span>
            </div>
          </Link>

          {/* Divider */}
          <div className="shrink-0 w-px h-5 bg-stroke mx-2 sm:mx-3" />

          {/* Nav Links */}
          <div className="flex items-center gap-0.5 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={cn(
                    "text-sm rounded-full px-4 py-2 transition-colors whitespace-nowrap shrink-0",
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
          <div className="shrink-0 w-px h-5 bg-stroke mx-2 sm:mx-3" />

          {/* CTA */}
          <div className="flex items-center gap-2 shrink-0 pr-1">
            {user ? (
              <>
                <Link href="/dashboard" className="group relative inline-flex text-sm rounded-full shrink-0">
                  <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-1 px-4 py-2 bg-surface rounded-full backdrop-blur-md text-text-primary transition-colors group-hover:bg-bg/80 whitespace-nowrap">
                    <User size={14} className="w-3.5 h-3.5" />
                    <span>My Space</span>
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-muted hover:text-text-primary p-2 transition-colors rounded-full hover:bg-stroke/50 shrink-0"
                  aria-label="Sign out"
                >
                  <LogOut size={16} className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="group relative inline-flex text-sm rounded-full shrink-0">
                <span className="absolute -inset-[2px] rounded-full accent-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center gap-1 px-4 py-2 bg-surface rounded-full backdrop-blur-md text-text-primary transition-colors group-hover:bg-bg/80 whitespace-nowrap">
                  <span>Sign In</span>
                  <ArrowUpRight size={14} className="w-3.5 h-3.5" />
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navbar - hidden on desktop, flex on mobile */}
        <div className="w-full md:hidden flex flex-col items-center">
          <div
            className={cn(
              "w-full max-w-[340px] xs:max-w-[380px] sm:max-w-md flex items-center justify-between rounded-full backdrop-blur-md border border-white/10 bg-surface px-3 py-2 transition-shadow duration-300",
              scrolled && "shadow-md shadow-black/40"
            )}
          >
            <Link href="/" className="group flex items-center justify-center h-8 rounded-full accent-gradient p-[1px] transition-transform duration-300 hover:scale-105">
              <div className="w-full h-full bg-bg rounded-full flex items-center justify-center px-3">
                <span className="font-display font-medium text-xs text-text-primary">Home</span>
              </div>
            </Link>

            {/* Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-text-primary p-1.5 rounded-full border border-white/10 bg-white/5 transition-colors focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div
              className="w-full max-w-[340px] xs:max-w-[380px] sm:max-w-md mt-2 rounded-2xl border border-white/10 bg-surface/95 backdrop-blur-xl p-4 flex flex-col gap-3 shadow-xl z-50 transition-all duration-300 animate-role-fade-in"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={cn(
                        "text-sm rounded-xl px-4 py-2.5 transition-colors font-body",
                        isActive 
                          ? "text-text-primary bg-stroke/60 font-medium" 
                          : "text-muted hover:text-text-primary hover:bg-stroke/40"
                      )}
                    >
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="h-px bg-stroke my-1" />

              {/* Auth actions inside dropdown */}
              <div className="flex flex-col gap-2">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <Link 
                      href="/dashboard" 
                      className="group relative flex items-center justify-center rounded-xl overflow-hidden p-[1px]"
                    >
                      <div className="absolute inset-0 accent-gradient" />
                      <div className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-bg hover:bg-bg/90 rounded-[11px] text-text-primary text-sm font-medium transition-colors">
                        <User size={14} />
                        <span>My Space</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-text-primary hover:bg-white/5 transition-colors text-sm font-medium"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <Link 
                    href="/auth/login" 
                    className="group relative flex items-center justify-center rounded-xl overflow-hidden p-[1px]"
                  >
                    <div className="absolute inset-0 accent-gradient" />
                    <div className="relative w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-bg hover:bg-bg/90 rounded-[11px] text-text-primary text-sm font-medium transition-colors">
                      <span>Sign In</span>
                      <ArrowUpRight size={14} />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
