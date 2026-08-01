// components/features/analytics/ExportReport.tsx

'use client';

import { useLearningStore } from '@/store/use-learning-store';

export function ExportReport() {
  const { progress, courses, learningProfile, totalTimeSpent } = useLearningStore();

  const generateReport = () => {
    const totalTopics = courses.reduce((acc, c) => acc + c.chapters.reduce((a: number, ch: any) => a + ch.topics.length, 0), 0);
    const completedTopics = Object.values(progress).filter(p => p.completed).length;
    const avgQuizScore = Object.values(progress)
      .filter(p => p.quizScore >= 0)
      .reduce((acc, p) => acc + p.quizScore, 0) / Object.values(progress).filter(p => p.quizScore >= 0).length || 0;

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTopics,
        completedTopics,
        completionRate: Math.round((completedTopics / totalTopics) * 100),
        avgQuizScore: Math.round(avgQuizScore),
        totalTimeSpent: Math.round(totalTimeSpent / 60),
        learningStyle: learningProfile.dominantStyle || 'unknown',
      },
      courses: courses.map(c => ({
        title: c.title,
        topics: c.chapters.reduce((acc: any, ch: any) => acc + ch.topics.length, 0),
        completedTopics: c.chapters.reduce((acc: any, ch: any) => acc + ch.topics.filter((t: any) => {
          const key = `${c.id}:${t.slug}`;
          return progress[key]?.completed;
        }).length, 0),
      })),
      quizScores: Object.entries(progress)
        .filter(([key, p]) => p.quizScore >= 0)
        .map(([key, p]) => ({
          topic: key.split(':')[1],
          score: p.quizScore,
        })),
    };

    // Download as JSON
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePDF = () => {
    // Could use a library like jsPDF or html2canvas
    alert('PDF export coming soon!');
  };

  return (
    <div className="export-report">
      <h3>📤 Export Report</h3>
      <div className="export-actions">
        <button className="export-btn" onClick={generateReport}>
          📄 Export as JSON
        </button>
        <button className="export-btn" onClick={generatePDF}>
          📑 Export as PDF
        </button>
      </div>
    </div>
  );
}