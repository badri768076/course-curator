'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ padding: '3rem', textAlign: 'center', maxWidth: '450px' }}>
        <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1.5rem auto' }} />
        <CardTitle style={{ color: 'white' }}>Something Went Wrong</CardTitle>
        <CardDescription style={{ marginTop: '0.5rem', color: 'hsl(var(--text-secondary))' }}>
          {error.message || 'An error occurred while loading this topic.'}
        </CardDescription>
        <Button onClick={() => reset()} style={{ marginTop: '1.5rem', width: '100%' }}>
          Try Again
        </Button>
      </Card>
    </div>
  );
}
