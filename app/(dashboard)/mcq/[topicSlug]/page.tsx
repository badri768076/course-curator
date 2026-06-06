'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLearningStore } from '@/store/use-learning-store';
import { MCQForm } from '@/components/features/mcq/MCQForm';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { ROUTES } from '@/constants/routes';

export default function MCQPage({ params }: { params: { topicSlug: string } }) {
  const router = useRouter();
  const { courses, activeCourseId } = useLearningStore();

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;
  const currentSlug = params.topicSlug;

  if (!activeCourse) {
    return (
      <Card style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <CardTitle>Session Not Found</CardTitle>
        <CardDescription style={{ marginTop: '0.5rem' }}>No active course syllabus selected. Please return to the dashboard.</CardDescription>
        <Button onClick={() => router.push(ROUTES.dashboard)} style={{ marginTop: '1.5rem' }}>
          Go to Dashboard
        </Button>
      </Card>
    );
  }

  // Find topic
  let activeTopic: any = null;
  activeCourse.chapters.forEach((chapter) => {
    const found = chapter.topics.find((t) => t.slug === currentSlug);
    if (found) {
      activeTopic = found;
    }
  });

  if (!activeTopic || !activeTopic.quiz || activeTopic.quiz.length === 0) {
    return (
      <Card style={{ maxWidth: '500px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 1rem auto' }} />
        <CardTitle>Quiz Not Found</CardTitle>
        <CardDescription style={{ marginTop: '0.5rem' }}>No quiz generated for this topic yet.</CardDescription>
        <Button onClick={() => router.push(ROUTES.topic(currentSlug))} style={{ marginTop: '1.5rem' }}>
          Back to Lesson
        </Button>
      </Card>
    );
  }

  return (
    <div style={{ padding: '1rem 0' }}>
      <MCQForm
        questions={activeTopic.quiz}
        topicSlug={currentSlug}
        topicTitle={activeTopic.title}
      />
    </div>
  );
}
