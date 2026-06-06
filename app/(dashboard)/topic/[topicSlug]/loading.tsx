import React from 'react';
import { Loader } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function Loading() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '350px' }}>
        <Loader className="animate-spin" size={32} color="hsl(var(--primary-violet))" />
        <p style={{ fontWeight: 600, color: 'white' }}>Synthesizing Lesson Workspace...</p>
        <p style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Building dynamic visualizations and video hooks</p>
      </Card>
    </div>
  );
}
