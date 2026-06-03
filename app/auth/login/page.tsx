'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { signInWithGoogle, signInWithEmail, mapAuthError } from '@/lib/auth';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import HlsVideo from '@/components/ui/HlsVideo';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await signInWithEmail(data.email, data.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(mapAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Welcome to AstroLens!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(mapAuthError(err.code));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-6 overflow-hidden">
      {/* Background Video */}
      <div className="absolute inset-0 z-0">
        <HlsVideo 
          src="https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8"
          autoPlay 
          muted 
          loop 
          playsInline
          preload="auto"
          className="min-w-full min-h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-2 h-2 rounded-full bg-accent-gradient shadow-[0_0_12px_rgba(137,170,204,0.6)]" />
            <span className="font-display text-xl text-text-primary tracking-tight">AstroLens</span>
          </Link>
          <h1 className="font-display text-4xl text-text-primary tracking-tight mb-2">
            Welcome <em className="italic text-text-primary/70">back</em>
          </h1>
          <p className="text-muted font-body text-sm">
            Sign in to your AstroLens account
          </p>
        </div>

        <div className="liquid-glass rounded-3xl p-8 md:p-10">
          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full bg-white text-black rounded-xl p-3.5 flex items-center justify-center gap-3 font-body font-medium text-sm transition-all hover:bg-white/90 disabled:opacity-70 disabled:cursor-not-allowed mb-6"
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-stroke/50" />
            <span className="text-muted font-body text-xs uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-stroke/50" />
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-5">
              <label className="block text-xs font-body font-medium text-muted uppercase tracking-widest mb-2" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="w-full bg-white/5 border border-stroke/50 rounded-xl p-3.5 text-text-primary font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-primary/30"
                placeholder="you@example.com"
                {...register('email')}
              />
              {errors.email && (
               <div className="flex items-center gap-1.5 mt-2 text-[#FF6B6B] font-body text-xs">
                  <AlertCircle size={14} />
                  {errors.email.message}
                </div>
              )}
            </div>

            <div className="mb-2">
              <label className="block text-xs font-body font-medium text-muted uppercase tracking-widest mb-2" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="w-full bg-white/5 border border-stroke/50 rounded-xl p-3.5 pr-12 text-text-primary font-body text-sm focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent transition-all placeholder:text-text-primary/30"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-text-primary transition-colors focus:outline-none"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-1.5 mt-2 text-[#FF6B6B] font-body text-xs">
                  <AlertCircle size={14} />
                  {errors.password.message}
                </div>
              )}
            </div>

            <div className="text-right mb-6">
              <Link href="/auth/reset-password" className="text-accent hover:text-white transition-colors font-body text-xs">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-gradient text-bg rounded-xl p-3.5 flex items-center justify-center font-body font-medium text-sm transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center mt-8 text-sm text-muted font-body">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-accent hover:text-white transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
