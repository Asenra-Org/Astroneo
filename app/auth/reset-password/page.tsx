'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { resetPassword, mapAuthError } from '@/lib/auth';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import CosmicBackground from '@/components/home/CosmicBackground';
import StarParticles from '@/components/home/StarParticles';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await resetPassword(data.email);
      setSent(true);
      toast.success('Reset email sent! Check your inbox.');
    } catch (err: any) {
      toast.error(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '24px' }}>
      <CosmicBackground />
      <StarParticles />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 12px rgba(0,212,255,0.8)' }} />
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.1rem', color: '#F0F0F0' }}>AstroLens</span>
          </Link>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#F0F0F0', marginTop: '20px', marginBottom: '6px' }}>
            Reset your password
          </h1>
          <p style={{ color: '#8A8A9A', fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem' }}>
            We&apos;ll send a reset link to your email
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <CheckCircle size={40} color="#00CC88" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', color: '#F0F0F0', marginBottom: '8px' }}>Email sent!</h3>
              <p style={{ color: '#8A8A9A', fontFamily: 'DM Sans, sans-serif', fontSize: '0.85rem', marginBottom: '24px' }}>
                Check your inbox and follow the link to reset your password.
              </p>
              <Link href="/auth/login" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" htmlFor="email">Email address</label>
                <input id="email" type="email" className="form-input" placeholder="you@example.com" {...register('email')} />
                {errors.email && (
                  <div className="form-error"><AlertCircle size={12} />{errors.email.message}</div>
                )}
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: '16px', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <Link href="/auth/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#8A8A9A', textDecoration: 'none', fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif' }}>
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
