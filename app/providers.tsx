'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(10, 10, 20, 0.92)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#F0F0F0',
            backdropFilter: 'blur(20px)',
            fontFamily: 'DM Sans, sans-serif',
          },
        }}
      />
    </AuthProvider>
  );
}
