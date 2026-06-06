import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: 'Course Curator AI | Interactive Adaptive Learning',
  description: 'Design custom visual learning pathways with AI. Includes interactive mindmaps, curated lectures, and adaptive quizzes to master any subject in real-time.',
  keywords: ['AI learning', 'course curator', 'interactive mindmap', 'adaptive quiz', 'syllabus planner'],
  authors: [{ name: 'Course Curator Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <QueryProvider>
          <AuthProvider>
            <div className="aurora-bg"><div className="aurora-bg-blob"></div></div>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
