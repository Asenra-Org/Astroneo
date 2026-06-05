'use client';

import Link from 'next/link';
import { Mail, Globe } from 'lucide-react';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stroke/50 pt-16 pb-8 mt-auto bg-bg">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-start mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-accent-gradient shadow-[0_0_12px_rgba(137,170,204,0.6)]" />
              <span className="font-display text-xl text-text-primary tracking-tight">
                Astroneo
              </span>
            </div>
            <a href="https://asenra.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 mb-4 opacity-60 hover:opacity-100 transition-opacity w-fit">
              <span className="text-[11px] uppercase tracking-widest text-muted font-body">BY</span>
              <img src="/asenra-logo.png" alt="Asenra" className="h-[60px] object-contain object-left -ml-1" />
            </a>
            <p className="font-body text-sm text-muted max-w-sm leading-relaxed">
              Search the stars. Explore the universe. Free astronomical data for everyone.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-16">
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-[0.1em] font-medium mb-4">
                Product
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Explore', href: '/explore' },
                  { label: 'Blog', href: '/blog' },
                  { label: 'About', href: '/about' },
                ].map(({ label, href }) => (
                  <Link 
                    key={label} 
                    href={href} 
                    className="font-body text-sm text-muted hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="font-body text-xs text-muted uppercase tracking-[0.1em] font-medium mb-4">
                Legal
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { label: 'Privacy Policy', href: '/privacy-policy' },
                  { label: 'Terms', href: '/terms' },
                ].map(({ label, href }) => (
                  <Link 
                    key={label} 
                    href={href} 
                    className="font-body text-sm text-muted hover:text-text-primary transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap justify-between items-center pt-8 border-t border-stroke/30 gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/asenra-icon.png" alt="Asenra" className="w-4 h-4 object-contain opacity-50" />
            <p className="font-body text-xs text-muted pt-0.5">
              © {year} Astroneo by Asenra. All rights reserved.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://astroneo.space"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-text-primary transition-colors"
              aria-label="Website"
            >
              <Globe size={18} />
            </a>
            <a
              href="mailto:contact@astroneo.space"
              className="text-muted hover:text-text-primary transition-colors"
              aria-label="Email"
            >
              <Mail size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
