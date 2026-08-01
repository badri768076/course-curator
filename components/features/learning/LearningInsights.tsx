// components/features/learning/LearningInsights.tsx

'use client';

import { useLearningStore } from '@/store/use-learning-store';
import { LearningStyle } from '@/types/learning-style';

const RECOMMENDATIONS: Record<LearningStyle, string[]> = {
  'visual': [
    '📊 Use mindmaps and flowcharts to visualize concepts',
    '🎨 Watch videos with visual aids and animations',
    '🖼️ Take visual notes with diagrams and color coding',
    '📈 Create charts and graphs to understand data',
  ],
  'auditory': [
    '🎧 Listen to video transcripts and audio summaries',
    '🗣️ Read explanations out loud to reinforce learning',
    '🎵 Use audio resources and podcasts when available',
    '💬 Discuss topics with others to deepen understanding',
  ],
  'read-write': [
    '📝 Take detailed written notes for each topic',
    '📖 Read summaries thoroughly before watching videos',
    '✍️ Rewrite key concepts in your own words',
    '📚 Create study guides and bullet point summaries',
  ],
  'kinesthetic': [
    '🏃 Take short breaks between topics to stay focused',
    '💻 Practice with interactive quizzes and exercises',
    '🎯 Apply concepts with real-world examples',
    '🖐️ Use hands-on activities and projects',
  ],
  'unknown': [
    '📚 Try different learning methods to find what works',
    '🎯 Take the learning style quiz for personalized insights',
    '🧠 Explore various content formats (video, text, interactive)',
    '💡 Pay attention to what helps you learn best',
  ],
};

export function LearningInsights() {
  const { learningProfile, progress, courses, activeCourseId } = useLearningStore();
  const activeCourse = courses.find(c => c.id === activeCourseId);
  const style = learningProfile.dominantStyle || 'unknown';

  const totalTopics = activeCourse?.chapters.reduce((acc, ch) => acc + ch.topics.length, 0) || 0;
  const completedTopics = Object.values(progress).filter(p => p.completed).length;
  const completionRate = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  const stats = [
    { label: 'Video Pauses', value: learningProfile.videoPauses, icon: '⏸️' },
    { label: 'Video Rewinds', value: learningProfile.videoRewinds, icon: '⏪' },
    { label: 'Video Skips', value: learningProfile.videoSkips, icon: '⏭️' },
    { label: 'Quiz Attempts', value: learningProfile.sessionCount, icon: '📝' },
    { label: 'Completion Rate', value: `${completionRate}%`, icon: '📊' },
    { label: 'Avg Quiz Speed', value: `${learningProfile.quizAttemptSpeedAvg.toFixed(1)}s`, icon: '⚡' },
  ];

  const recommendations = RECOMMENDATIONS[style] || RECOMMENDATIONS['unknown'];

  return (
    <div className="learning-insights">
      <div className="insights-header">
        <h3>📊 Learning Insights</h3>
        <span className="insights-style-badge">
          {style !== 'unknown' ? `${getStyleEmoji(style)} ${getStyleLabel(style)}` : '🧠 Take the quiz!'}
        </span>
      </div>
      
      <div className="insights-grid">
        {stats.map((stat, index) => (
          <div key={index} className="insight-card">
            <span className="insight-icon">{stat.icon}</span>
            <div>
              <div className="insight-value">{stat.value}</div>
              <div className="insight-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="recommendations">
        <h4>💡 Personalized Recommendations</h4>
        <ul className="recommendations-list">
          {recommendations.map((rec, index) => (
            <li key={index} className="recommendation-item">
              <span className="recommendation-bullet">•</span>
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getStyleEmoji(style: LearningStyle): string {
  const emojis: Record<LearningStyle, string> = {
    'visual': '👁️',
    'auditory': '👂',
    'read-write': '📝',
    'kinesthetic': '🏃',
    'unknown': '🧠',
  };
  return emojis[style] || '🧠';
}

function getStyleLabel(style: LearningStyle): string {
  const labels: Record<LearningStyle, string> = {
    'visual': 'Visual',
    'auditory': 'Auditory',
    'read-write': 'Read/Write',
    'kinesthetic': 'Kinesthetic',
    'unknown': 'Unknown',
  };
  return labels[style] || 'Unknown';
}