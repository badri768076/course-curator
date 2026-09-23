'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Map,
  Play,
  Sparkles,
} from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import styles from './landing-page.module.css';

export default function HomePage() {
  const router = useRouter();

  const handleStartLearning = () => {
    router.push(ROUTES.dashboard);
  };

  return (
    <main className={styles.page}>
      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.brand}>
          <div className={styles.brandMark}>
            <BookOpen size={17} strokeWidth={2.2} />
          </div>

          <span className={styles.brandName}>CourseCurator</span>
        </div>

        <div className={styles.navActions}>
          <button
            className={styles.navLink}
            onClick={() => router.push(ROUTES.dashboard)}
          >
            Workspace
          </button>

          <button
            className={styles.navCta}
            onClick={handleStartLearning}
          >
            Start learning
            <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            <span>YOUR PERSONAL LEARNING WORKSPACE</span>
          </div>

          <h1 className={styles.heroTitle}>
            Learn with a path,
            <br />
            <em>not a pile of links.</em>
          </h1>

          <p className={styles.heroDescription}>
            CourseCurator turns a topic you want to understand into a
            structured learning journey — with lessons, visual maps,
            explanations, videos, and practice in one place.
          </p>

          <div className={styles.heroActions}>
            <button
              className={styles.primaryButton}
              onClick={handleStartLearning}
            >
              Start learning
              <ArrowRight size={17} />
            </button>

            <button
              className={styles.secondaryButton}
              onClick={() => router.push(ROUTES.dashboard)}
            >
              Explore workspace
              <ChevronRight size={16} />
            </button>
          </div>

          <div className={styles.heroNote}>
            <CheckCircle2 size={15} />
            <span>Generate a course and start learning immediately.</span>
          </div>
        </div>

        {/* Workspace Preview */}
        <div className={styles.heroVisual}>
          <div className={styles.previewShadow} />

          <div className={styles.workspacePreview}>
            <div className={styles.previewTopbar}>
              <div>
                <div className={styles.previewKicker}>
                  CURRENT COURSE
                </div>

                <h2>Machine Learning Foundations</h2>
              </div>

              <div className={styles.progressBadge}>
                42%
              </div>
            </div>

            <div className={styles.previewDivider} />

            <div className={styles.previewBody}>
              {/* Course chapters */}
              <aside className={styles.previewSidebar}>
                <span className={styles.previewSectionLabel}>
                  COURSE MAP
                </span>

                <div className={styles.chapter}>
                  <span className={styles.chapterNumber}>01</span>
                  <span>Introduction</span>
                  <CheckCircle2 size={14} />
                </div>

                <div
                  className={`${styles.chapter} ${styles.chapterActive}`}
                >
                  <span className={styles.chapterNumber}>02</span>
                  <span>Machine Learning</span>
                </div>

                <div className={styles.chapter}>
                  <span className={styles.chapterNumber}>03</span>
                  <span>Model Training</span>
                </div>

                <div className={styles.chapter}>
                  <span className={styles.chapterNumber}>04</span>
                  <span>Evaluation</span>
                </div>
              </aside>

              {/* Current lesson */}
              <div className={styles.previewContent}>
                <div className={styles.contentHeader}>
                  <div>
                    <span className={styles.contentLabel}>
                      CURRENT LESSON
                    </span>

                    <h3>What is Supervised Learning?</h3>
                  </div>

                  <div className={styles.lessonIcon}>
                    <Play size={18} fill="currentColor" />
                  </div>
                </div>

                <div className={styles.lessonProgress}>
                  <div className={styles.progressTrack}>
                    <div className={styles.progressFill} />
                  </div>

                  <span>18 min left</span>
                </div>

                <div className={styles.topicList}>
                  <div
                    className={`${styles.topicItem} ${styles.topicStatusDone}`}
                  >
                    <CheckCircle2 size={16} />
                    <span>Introduction to ML</span>
                    <span className={styles.topicTime}>12 min</span>
                  </div>

                  <div
                    className={`${styles.topicItem} ${styles.topicItemActive}`}
                  >
                    <span className={styles.topicStatusCurrent}>
                      02
                    </span>

                    <span>Supervised Learning</span>

                    <span className={styles.topicTime}>
                      Learning
                    </span>
                  </div>

                  <div className={styles.topicItem}>
                    <span className={styles.topicStatus}>03</span>
                    <span>Regression & Classification</span>
                    <span className={styles.topicTime}>24 min</span>
                  </div>

                  <div className={styles.topicItem}>
                    <span className={styles.topicStatus}>04</span>
                    <span>Model Evaluation</span>
                    <span className={styles.topicTime}>16 min</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.previewBottom}>
              <div className={styles.bottomFeature}>
                <Map size={15} />
                <span>Visual roadmap</span>
              </div>

              <div className={styles.bottomFeature}>
                <Brain size={15} />
                <span>Adaptive learning</span>
              </div>

              <div className={styles.bottomFeature}>
                <Layers3 size={15} />
                <span>Practice included</span>
              </div>
            </div>
          </div>

          {/* Floating information card */}
          <div className={styles.floatingCard}>
            <div className={styles.floatingIcon}>
              <Sparkles size={16} />
            </div>

            <div>
              <strong>Learning path ready</strong>
              <span>12 topics organized for you</span>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className={styles.principles}>
        <div className={styles.sectionIntro}>
          <div className={styles.sectionNumber}>01</div>

          <div>
            <span className={styles.sectionLabel}>
              THE IDEA
            </span>

            <h2>
              Everything you need to move
              <br />
              from curiosity to understanding.
            </h2>
          </div>
        </div>

        <div className={styles.featureGrid}>
          <article className={styles.feature}>
            <span className={styles.featureNumber}>01</span>

            <div className={styles.featureIcon}>
              <Map size={20} />
            </div>

            <h3>Structured courses</h3>

            <p>
              Start with a topic and get a logical sequence of
              concepts instead of figuring out what to learn next.
            </p>
          </article>

          <article className={styles.feature}>
            <span className={styles.featureNumber}>02</span>

            <div className={styles.featureIcon}>
              <Layers3 size={20} />
            </div>

            <h3>Learn visually</h3>

            <p>
              Connect ideas through mindmaps, flowcharts and
              organized course roadmaps.
            </p>
          </article>

          <article className={styles.feature}>
            <span className={styles.featureNumber}>03</span>

            <div className={styles.featureIcon}>
              <Brain size={20} />
            </div>

            <h3>Adapt as you learn</h3>

            <p>
              Explanations, summaries and learning material can
              adjust to the way you prefer to study.
            </p>
          </article>

          <article className={styles.feature}>
            <span className={styles.featureNumber}>04</span>

            <div className={styles.featureIcon}>
              <CheckCircle2 size={20} />
            </div>

            <h3>Practice in context</h3>

            <p>
              Reinforce each topic with quizzes and practical
              checkpoints instead of leaving practice until the end.
            </p>
          </article>
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <div>
          <span className={styles.sectionLabel}>
            READY WHEN YOU ARE
          </span>

          <h2>
            Pick something you
            <br />
            want to understand.
          </h2>
        </div>

        <button
          className={styles.finalButton}
          onClick={handleStartLearning}
        >
          Open CourseCurator
          <ArrowRight size={17} />
        </button>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <div className={styles.footerMark}>
            <BookOpen size={14} />
          </div>

          <span>CourseCurator</span>
        </div>

        <span className={styles.footerText}>
          A focused workspace for learning better.
        </span>

        <span className={styles.footerYear}>
          2026
        </span>
      </footer>
    </main>
  );
}