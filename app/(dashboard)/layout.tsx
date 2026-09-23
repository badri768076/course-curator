'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Brain,
  LayoutDashboard,
  LogOut,
  BookOpen,
  User,
  Award,
  ChevronRight,
} from 'lucide-react';

import { useLearningStore } from '@/store/use-learning-store';
import { ROUTES } from '@/constants/routes';
import styles from './dashboard-layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    courses,
    activeCourseId,
    setActiveCourse,
    progress,
  } = useLearningStore();

  const handleLogout = () => {
    router.push('/');
  };

  const getCompletedCount = () => {
    return Object.values(progress).filter((p) => p.completed).length;
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>

          {/* Brand */}
          <button
            className={styles.brand}
            onClick={() => router.push('/')}
            aria-label="Go to Course Curator home"
          >
            <div className={styles.brandMark}>
              <Brain size={17} strokeWidth={2.2} />
            </div>

            <span className={styles.brandName}>
              Course<span>Curator</span>
            </span>
          </button>

          {/* Main navigation */}
          <nav className={styles.navigation}>
            <div className={styles.sectionLabel}>Workspace</div>

            <button
              className={`${styles.navItem} ${pathname === ROUTES.dashboard ? styles.navItemActive : ''
                }`}
              onClick={() => router.push(ROUTES.dashboard)}
            >
              <LayoutDashboard size={17} strokeWidth={1.9} />

              <span>Dashboard</span>

              {pathname === ROUTES.dashboard && (
                <ChevronRight
                  size={15}
                  className={styles.navArrow}
                />
              )}
            </button>
          </nav>

          {/* Courses */}
          <section className={styles.courseSection}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionLabel}>Active courses</span>

              {courses.length > 0 && (
                <span className={styles.courseCount}>
                  {courses.length}
                </span>
              )}
            </div>

            {courses.length === 0 ? (
              <div className={styles.emptyCourses}>
                No generated courses yet
              </div>
            ) : (
              <div className={styles.courseList}>
                {courses.map((course) => {
                  const isActive = course.id === activeCourseId;

                  return (
                    <button
                      key={course.id}
                      className={`${styles.courseItem} ${isActive ? styles.courseItemActive : ''
                        }`}
                      onClick={() => {
                        setActiveCourse(course.id);
                        router.push(ROUTES.dashboard);
                      }}
                      title={course.title}
                    >
                      <BookOpen
                        size={15}
                        strokeWidth={1.8}
                        className={styles.courseIcon}
                      />

                      <span className={styles.courseTitle}>
                        {course.title}
                      </span>

                      {isActive && (
                        <span className={styles.activeDot} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Progress */}
          <section className={styles.progressSection}>
            <div className={styles.sectionLabel}>Progress</div>

            <div className={styles.progressCard}>
              <div className={styles.progressIcon}>
                <Award size={17} strokeWidth={1.8} />
              </div>

              <div>
                <div className={styles.progressValue}>
                  {getCompletedCount()}
                </div>

                <div className={styles.progressLabel}>
                  topics completed
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* User section */}
        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.userAvatar}>
              <User size={16} strokeWidth={1.8} />
            </div>

            <div className={styles.userInfo}>
              <span className={styles.userName}>
                Arena Competitor
              </span>

              <span className={styles.userEmail}>
                hacker@hackarena.com
              </span>
            </div>
          </div>

          <button
            className={styles.logoutButton}
            onClick={handleLogout}
          >
            <LogOut size={15} strokeWidth={1.8} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}