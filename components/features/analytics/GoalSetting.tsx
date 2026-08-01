// components/features/analytics/GoalSetting.tsx

'use client';

import { useState } from 'react';
import { useLearningStore } from '@/store/use-learning-store';

interface Goal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly';
  target: number;
  current: number;
  progress: number;
}

export function GoalSetting() {
  const { progress, courses, totalTimeSpent } = useLearningStore();
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      type: 'daily',
      target: 30,
      current: 15,
      progress: 50,
    },
    {
      id: '2',
      type: 'weekly',
      target: 5,
      current: 3,
      progress: 60,
    },
    {
      id: '3',
      type: 'monthly',
      target: 20,
      current: 12,
      progress: 60,
    },
  ]);
  
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const totalTopics = courses.reduce((acc, c) => acc + c.chapters.reduce((a: number, ch: any) => a + ch.topics.length, 0), 0);
  const completedTopics = Object.values(progress).filter(p => p.completed).length;
  const completionRate = Math.round((completedTopics / totalTopics) * 100);

  return (
    <div className="goal-setting">
      <div className="goal-header">
        <h3>🎯 Goals & Milestones</h3>
        <button 
          className="add-goal-btn"
          onClick={() => setShowGoalModal(true)}
        >
          + Add Goal
        </button>
      </div>

      <div className="goal-progress-overview">
        <div className="overview-stat">
          <span className="stat-number">{completionRate}%</span>
          <span className="stat-label">Overall Progress</span>
        </div>
        <div className="overview-stat">
          <span className="stat-number">{totalTopics}</span>
          <span className="stat-label">Total Topics</span>
        </div>
        <div className="overview-stat">
          <span className="stat-number">{completedTopics}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="overview-stat">
          <span className="stat-number">{Math.round(totalTimeSpent / 60)}</span>
          <span className="stat-label">Minutes Studied</span>
        </div>
      </div>

      <div className="goals-list">
        {goals.map((goal) => (
          <GoalCard 
            key={goal.id}
            goal={goal}
            onEdit={() => {
              setSelectedGoal(goal);
              setShowGoalModal(true);
            }}
          />
        ))}
      </div>

      {showGoalModal && (
        <GoalModal 
          goal={selectedGoal}
          onClose={() => {
            setShowGoalModal(false);
            setSelectedGoal(null);
          }}
          onSave={(goal: Goal) => {
            if (selectedGoal) {
              // Update existing goal
              setGoals(goals.map(g => g.id === goal.id ? goal : g));
            } else {
              // Add new goal
              setGoals([...goals, { ...goal, id: Date.now().toString() }]);
            }
            setShowGoalModal(false);
            setSelectedGoal(null);
          }}
        />
      )}
    </div>
  );
}

function GoalCard({ goal, onEdit }: any) {
  const getIcon = (type: string) => {
    switch(type) {
      case 'daily': return '📅';
      case 'weekly': return '📆';
      case 'monthly': return '🗓️';
      default: return '🎯';
    }
  };

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <span className="goal-icon">{getIcon(goal.type)}</span>
        <span className="goal-type">{goal.type.charAt(0).toUpperCase() + goal.type.slice(1)}</span>
        <span className="goal-progress-text">{goal.progress}%</span>
        <button className="goal-edit-btn" onClick={onEdit}>✏️</button>
      </div>
      <div className="goal-progress-bar">
        <div 
          className="goal-progress-fill"
          style={{ width: `${goal.progress}%` }}
        />
      </div>
      <div className="goal-details">
        <span>{goal.current} / {goal.target} completed</span>
        <span>{goal.progress >= 100 ? '✅ Complete!' : `${100 - goal.progress}% to go`}</span>
      </div>
    </div>
  );
}

function GoalModal({ goal, onClose, onSave }: any) {
  const [type, setType] = useState(goal?.type || 'daily');
  const [target, setTarget] = useState(goal?.target || 10);
  
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{goal ? 'Edit Goal' : 'New Goal'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Goal Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-select"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Target</label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="form-input"
            />
            <span className="form-hint">Topics to complete</span>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-save"
            onClick={() => onSave({ ...goal, type, target })}
          >
            {goal ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}