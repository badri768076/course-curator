// components/features/learning/LearningStyleQuiz.tsx

'use client';

import { useState } from 'react';
import { useLearningStore } from '@/store/use-learning-store';
import { LearningStyle } from '@/types/learning-style';

interface Question {
  id: number;
  text: string;
  options: {
    text: string;
    style: LearningStyle;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'When learning something new, you prefer to:',
    options: [
      { text: 'Watch a video or see diagrams', style: 'visual' },
      { text: 'Listen to explanations', style: 'auditory' },
      { text: 'Read written instructions', style: 'read-write' },
      { text: 'Try it hands-on', style: 'kinesthetic' },
    ],
  },
  {
    id: 2,
    text: 'You remember things best when you:',
    options: [
      { text: 'Visualize them in your mind', style: 'visual' },
      { text: 'Hear them spoken aloud', style: 'auditory' },
      { text: 'Write them down', style: 'read-write' },
      { text: 'Do them yourself', style: 'kinesthetic' },
    ],
  },
  {
    id: 3,
    text: 'When solving a problem, you tend to:',
    options: [
      { text: 'Sketch it out', style: 'visual' },
      { text: 'Talk it through', style: 'auditory' },
      { text: 'Write down the steps', style: 'read-write' },
      { text: 'Experiment with solutions', style: 'kinesthetic' },
    ],
  },
  {
    id: 4,
    text: 'You prefer learning materials that are:',
    options: [
      { text: 'Rich with images and graphs', style: 'visual' },
      { text: 'Audio-based or spoken', style: 'auditory' },
      { text: 'Text-heavy with detailed explanations', style: 'read-write' },
      { text: 'Interactive with practice exercises', style: 'kinesthetic' },
    ],
  },
  {
    id: 5,
    text: 'When taking notes, you prefer to:',
    options: [
      { text: 'Draw diagrams and mindmaps', style: 'visual' },
      { text: 'Record audio notes', style: 'auditory' },
      { text: 'Write detailed bullet points', style: 'read-write' },
      { text: 'Create flashcards to practice', style: 'kinesthetic' },
    ],
  },
];

export function LearningStyleQuiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [resultStyle, setResultStyle] = useState<LearningStyle>('unknown');
  const { computeAndUpdateStyle } = useLearningStore();

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
    const newAnswers = [...answers, optionIndex];
    setAnswers(newAnswers);

    if (currentQuestion < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedOption(null);
      }, 500);
    } else {
      // Calculate learning style
      const styleScores: Record<LearningStyle, number> = {
        visual: 0,
        auditory: 0,
        'read-write': 0,
        kinesthetic: 0,
        unknown: 0,
      };

      newAnswers.forEach((answerIndex, qIndex) => {
        const style = QUESTIONS[qIndex].options[answerIndex].style;
        if (style !== 'unknown') {
          styleScores[style] = (styleScores[style] || 0) + 1;
        }
      });

      // Find dominant style
      let dominantStyle: LearningStyle = 'unknown';
      let maxScore = 0;
      for (const [style, score] of Object.entries(styleScores)) {
        if (score > maxScore && style !== 'unknown') {
          maxScore = score;
          dominantStyle = style as LearningStyle;
        }
      }

      setResultStyle(dominantStyle);
      
      // Update profile with the result
      setTimeout(() => {
        computeAndUpdateStyle();
        setShowResults(true);
      }, 500);
    }
  };

  const getResultMessage = () => {
    const messages: Record<LearningStyle, string> = {
      'visual': '👁️ You are a Visual Learner! You learn best by seeing and visualizing information. Try using mindmaps, diagrams, and color-coded notes.',
      'auditory': '👂 You are an Auditory Learner! You learn best by listening and hearing information. Try using audio summaries, podcasts, and group discussions.',
      'read-write': '📝 You are a Read/Write Learner! You learn best by reading and writing information. Try taking detailed notes, reading summaries, and rewriting concepts.',
      'kinesthetic': '🏃 You are a Kinesthetic Learner! You learn best by doing and experiencing things. Try hands-on practice, quizzes, and real-world applications.',
      'unknown': '🧠 Your learning style is being analyzed. Try exploring different learning methods to find what works best for you!',
    };
    return messages[resultStyle] || messages['unknown'];
  };

  if (showResults) {
    return (
      <div className="quiz-results-card">
        <div className="quiz-results-icon">🎉</div>
        <h3>Quiz Complete!</h3>
        <p className="quiz-result-message">{getResultMessage()}</p>
        <p className="quiz-result-hint">
          💡 Your learning profile has been updated. The app will now adapt content to your style!
        </p>
        <button 
          className="quiz-restart-btn"
          onClick={() => {
            setCurrentQuestion(0);
            setAnswers([]);
            setShowResults(false);
            setSelectedOption(null);
            setResultStyle('unknown');
          }}
        >
          Retake Quiz
        </button>
      </div>
    );
  }

  const question = QUESTIONS[currentQuestion];

  return (
    <div className="learning-quiz">
      <div className="quiz-header">
        <span className="quiz-progress">
          Question {currentQuestion + 1} of {QUESTIONS.length}
        </span>
        <div className="quiz-progress-bar">
          <div 
            className="quiz-progress-fill"
            style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="quiz-question-text">{question.text}</h3>

      <div className="quiz-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`quiz-option-btn ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => handleAnswer(index)}
            disabled={selectedOption !== null}
          >
            <span className="quiz-option-letter">{String.fromCharCode(65 + index)}</span>
            <span className="quiz-option-text">{option.text}</span>
            {selectedOption === index && <span className="quiz-option-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}