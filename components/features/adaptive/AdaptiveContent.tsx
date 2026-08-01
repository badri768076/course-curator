// components/features/adaptive/AdaptiveContent.tsx

'use client';

import { useLearningStore } from '@/store/use-learning-store';

interface AdaptiveContentProps {
  videoAnalysis: any;
  onTabChange: (tab: string) => void;
}

export function AdaptiveContent({ videoAnalysis, onTabChange }: AdaptiveContentProps) {
  const { learningProfile } = useLearningStore();
  const style = learningProfile.dominantStyle || 'unknown';

  // Priority order based on learning style
  const getTabPriority = () => {
    const priority: Record<string, string[]> = {
      'visual': ['mindmap', 'flowchart', 'video', 'summary', 'quiz'],
      'auditory': ['video', 'summary', 'quiz', 'mindmap', 'flowchart'],
      'read-write': ['summary', 'quiz', 'video', 'mindmap', 'flowchart'],
      'kinesthetic': ['quiz', 'video', 'flowchart', 'summary', 'mindmap'],
      'unknown': ['video', 'summary', 'quiz', 'mindmap', 'flowchart'],
    };

    return priority[style] || priority['unknown'];
  };

  const tabPriority = getTabPriority();
  const recommendedTab = tabPriority[0];

  // Check if content exists for each tab
  const hasContent = {
    video: !!videoAnalysis?.videoId,
    summary: !!videoAnalysis?.summary?.length,
    quiz: !!videoAnalysis?.quiz?.length,
    mindmap: !!videoAnalysis?.mindmap?.nodes?.length,
    flowchart: !!videoAnalysis?.flowchart?.nodes?.length,
  };

  // Auto-select recommended tab if content exists
  const autoSelectTab = () => {
    for (const tab of tabPriority) {
      if (hasContent[tab as keyof typeof hasContent]) {
        onTabChange(tab);
        return tab;
      }
    }
    return 'video';
  };

  // Get recommendation message
  const getRecommendationMessage = () => {
    const messages: Record<string, string> = {
      'visual': '👁️ We noticed you learn best visually! Try the Mindmap first.',
      'auditory': '👂 You seem to be an auditory learner. Start with the Video!',
      'read-write': '📝 You prefer reading. Check out the Summary section first!',
      'kinesthetic': '🏃 You learn by doing! Try the Quiz first!',
      'unknown': '🧠 Explore all formats to find what works best for you!',
    };

    return messages[style] || messages['unknown'];
  };

  return (
    <div className="adaptive-content">
      <div className="adaptive-banner">
        <span className="adaptive-icon">🎯</span>
        <p>{getRecommendationMessage()}</p>
        <button 
          className="adaptive-btn"
          onClick={() => autoSelectTab()}
        >
          Go to Recommended
        </button>
      </div>

      <div className="adaptive-tabs">
        {tabPriority.map((tab) => (
          <button
            key={tab}
            className={`adaptive-tab ${hasContent[tab as keyof typeof hasContent] ? 'active' : 'disabled'}`}
            onClick={() => hasContent[tab as keyof typeof hasContent] && onTabChange(tab)}
            disabled={!hasContent[tab as keyof typeof hasContent]}
          >
            {tab === 'video' && '▶️ Video'}
            {tab === 'summary' && '📝 Summary'}
            {tab === 'quiz' && '🧠 Quiz'}
            {tab === 'mindmap' && '🗺️ Mindmap'}
            {tab === 'flowchart' && '📊 Flowchart'}
            {!hasContent[tab as keyof typeof hasContent] && ' (Coming Soon)'}
          </button>
        ))}
      </div>
    </div>
  );
}