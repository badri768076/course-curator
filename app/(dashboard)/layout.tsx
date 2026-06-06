'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLearningStore } from '@/store/use-learning-store';
import { Brain, LayoutDashboard, LogOut, BookOpen, User, Award } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { courses, activeCourseId, setActiveCourse, progress } = useLearningStore();

  const handleLogout = () => {
    router.push('/');
  };

  const getCompletedCount = () => {
    return Object.values(progress).filter(p => p.completed).length;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Panel */}
      <aside
        style={{
          background: 'rgba(9, 12, 22, 0.95)',
          borderRight: '1px solid hsla(var(--border-glass))',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'sticky',
          top: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1.5rem 1.25rem' }}>
          
          {/* Logo segment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => router.push('/')}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, hsl(var(--primary-violet)), hsl(var(--primary-cyan)))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Brain size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-title)' }}>
              Course<span style={{ color: 'hsl(var(--primary-cyan))' }}>Curator</span>
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold', paddingLeft: '0.5rem' }}>Main</span>
            
            <button
              onClick={() => router.push(ROUTES.dashboard)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: '100%',
                padding: '0.75rem 0.85rem',
                background: pathname === ROUTES.dashboard ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: pathname === ROUTES.dashboard ? 'white' : 'hsl(var(--text-secondary))',
                fontSize: '0.9rem',
                fontWeight: pathname === ROUTES.dashboard ? '600' : 'normal',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <LayoutDashboard size={18} color={pathname === ROUTES.dashboard ? 'hsl(var(--primary-cyan))' : 'inherit'} />
              <span>Dashboard Overview</span>
            </button>
          </div>

          {/* Active courses listing */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold', paddingLeft: '0.5rem' }}>Active Syllabi</span>
            
            {courses.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))', paddingLeft: '0.5rem' }}>No generated courses yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', maxHeight: '180px', overflowY: 'auto' }}>
                {courses.map((course) => {
                  const isActive = course.id === activeCourseId;
                  return (
                    <button
                      key={course.id}
                      onClick={() => {
                        setActiveCourse(course.id);
                        router.push(ROUTES.dashboard);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.6rem 0.85rem',
                        background: isActive ? 'rgba(168, 85, 247, 0.1)' : 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        color: isActive ? 'white' : 'hsl(var(--text-secondary))',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <BookOpen size={14} color={isActive ? 'hsl(var(--primary-violet))' : 'inherit'} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{course.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Stats Badge */}
          <div style={{ borderTop: '1px solid hsla(var(--border-glass))', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ textTransform: 'uppercase', fontSize: '0.7rem', color: 'hsl(var(--text-muted))', fontWeight: 'bold', paddingLeft: '0.5rem' }}>Metrics</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', fontSize: '0.85rem' }}>
              <Award size={16} color="#eab308" />
              <span>{getCompletedCount()} Badges Unlocked</span>
            </div>
          </div>
        </div>

        {/* User / SignOut Segment */}
        <div style={{ padding: '1.25rem', borderTop: '1px solid hsla(var(--border-glass))', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid hsla(var(--border-glass))' }}>
              <User size={16} color="hsl(var(--primary-cyan))" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Arena Competitor</span>
              <span style={{ color: 'hsl(var(--text-muted))', fontSize: '0.75rem' }}>hacker@hackarena.com</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.5rem',
              background: 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: '#ef4444',
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
