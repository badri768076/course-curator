'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { loginAction } from '@/actions/auth';
import { Brain, Lock, Mail, Loader } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    try {
      await loginAction(email);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'radial-gradient(circle at center, hsla(var(--primary-violet)/0.1) 0%, transparent 60%)' }}>
      <div style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Brain size={16} color="#fff" />
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>CourseCurator</span>
      </div>

      <Card style={{ width: '100%', maxWidth: '400px', padding: '2rem' }} className="animate-slide-up">
        <CardHeader style={{ textAlign: 'center' }}>
          <CardTitle style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome Back</CardTitle>
          <CardDescription>Enter your email to access your learning portal</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '12px', top: '16px' }} />
                <input
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'hsl(var(--text-secondary))', fontWeight: 600 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="hsl(var(--text-muted))" style={{ position: 'absolute', left: '12px', top: '16px' }} />
                <input
                  type="password"
                  placeholder="••••••••"
                  defaultValue="hunter2"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  disabled
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>Demo Mode: Password is auto-filled</span>
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{error}</p>}
          </CardContent>

          <CardFooter style={{ marginTop: '1.5rem' }}>
            <Button type="submit" disabled={loading} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {loading ? <Loader className="animate-spin" size={16} /> : null}
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
