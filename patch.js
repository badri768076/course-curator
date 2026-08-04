const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8');

const newImports = `
import { Home, BookOpen, PenTool, Bot, HelpCircle, TrendingUp, Bookmark, FileText, BarChart2, User, Settings, Search, Bell, Moon } from 'lucide-react';
import './dashboard-new.css';
`;

// Add imports
content = content.replace("import { AITutorChat } from '@/components/features/chat/AITutorChat';", "import { AITutorChat } from '@/components/features/chat/AITutorChat';\n" + newImports);

// Add state
content = content.replace("const [showAnalytics, setShowAnalytics] = useState(false);", "const [showAnalytics, setShowAnalytics] = useState(false);\n  const [activeNav, setActiveNav] = useState('Dashboard');");

// Split by exact match of the legacy return
const rx = /return\s*\(\s*<div\s+className="dashboard-container">/;
const match = content.match(rx);

if (match) {
    const splitIndex = match.index;
    const beforeReturn = content.substring(0, splitIndex);
    let afterReturn = content.substring(splitIndex + match[0].length);

    // Re-add the outer div to keep the legacy structure intact for React
    afterReturn = '<div className="dashboard-container">' + afterReturn;

    const lastParen = afterReturn.lastIndexOf(';');
    afterReturn = afterReturn.substring(0, lastParen);
    afterReturn = afterReturn.replace(/\n\s*\)\s*$/, ''); // remove the closing paren of return if any

    const newReturn = `
  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="main-sidebar">
        <div className="brand-logo">
          <BookOpen className="brand-icon" />
          <span>CourseCurator AI</span>
        </div>
        
        <nav className="nav-menu">
          {[
            { id: 'Dashboard', icon: Home },
            { id: 'My Learning', icon: BookOpen },
            { id: 'Course Curator', icon: PenTool },
            { id: 'AI Tutor', icon: Bot },
            { id: 'Quiz Zone', icon: HelpCircle },
            { id: 'Progress', icon: TrendingUp },
            { id: 'Bookmarks', icon: Bookmark },
            { id: 'Notes', icon: FileText },
            { id: 'Analytics', icon: BarChart2 },
            { id: 'Profile', icon: User },
            { id: 'Settings', icon: Settings },
          ].map(item => (
            <button 
              key={item.id} 
              className={\`nav-item \${activeNav === item.id ? 'active' : ''}\`}
              onClick={() => setActiveNav(item.id)}
            >
              <item.icon size={18} />
              <span>{item.id}</span>
            </button>
          ))}
        </nav>

        <div className="learning-streak-card">
          <h4>Learning Streak 🔥</h4>
          <div className="streak-days">12 Days</div>
          <p>Keep it up! You're doing great.</p>
          <div className="streak-bar"><div className="streak-fill"></div></div>
        </div>
      </aside>

      <div className="main-envelope">
        {/* Topbar */}
        <header className="topbar">
          <div className="search-bar">
            <Search size={18} />
            <input type="text" placeholder="Search topics, notes, videos, questions..." />
            <span className="shortcut">Ctrl K</span>
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><Bell size={18} /></button>
            <button className="icon-btn"><Moon size={18} /></button>
            <div className="user-profile">
              <img src="https://ui-avatars.com/api/?name=Shreyasa&background=random" alt="User" />
              <span>Shreyasa ⌄</span>
            </div>
          </div>
        </header>

        <div className="content-envelope">
          {activeNav === 'Dashboard' && (
            <div className="dashboard-grid">
              <div className="dashboard-main-col">
                <div className="greeting-section">
                  <h2>Good morning, Shreyasa! 👋</h2>
                  <p>Let's continue your learning journey.</p>
                </div>

                <div className="top-stats-row">
                  <div className="continue-learning-card">
                    <h4>Continue Learning</h4>
                    <div className="continue-content">
                      <div className="video-thumb">
                        <div className="play-icon">▶</div>
                      </div>
                      <div className="continue-info">
                        <h3>Graph Traversal - DFS & BFS</h3>
                        <div className="progress-track">
                          <div className="progress-fill-bg"><div style={{width: '62%'}}></div></div>
                          <span>62%</span>
                        </div>
                        <p>Last watched 2 days ago</p>
                        <button className="continue-btn" onClick={() => setActiveNav('Course Curator')}>Continue →</button>
                      </div>
                    </div>
                  </div>

                  <div className="stats-2x2">
                    <div className="mini-stat">
                      <div className="stat-icon gray"><TrendingUp size={16}/></div>
                      <div className="stat-text">
                        <span>Total Learning Time</span>
                        <strong>48.6 hrs</strong>
                        <span className="stat-trend positive">+6.2 hrs this week</span>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="stat-icon green"><BookOpen size={16}/></div>
                      <div className="stat-text">
                        <span>Topics Completed</span>
                        <strong>26</strong>
                        <span className="stat-trend positive">+4 this week</span>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="stat-icon purple"><HelpCircle size={16}/></div>
                      <div className="stat-text">
                        <span>MCQ Accuracy</span>
                        <strong>82%</strong>
                        <span className="stat-trend positive">+8% improvement</span>
                      </div>
                    </div>
                    <div className="mini-stat">
                      <div className="stat-icon blue"><TrendingUp size={16}/></div>
                      <div className="stat-text">
                        <span>Exam Readiness</span>
                        <strong>Advanced</strong>
                        <span className="stat-trend normal">Top 18% of learners</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ai-recommended-section">
                  <h3>AI Recommended Videos</h3>
                  <div className="video-scroll">
                    {[
                      {title: "Depth First Search (DFS) - Full Visual Explanation", channel: "Tech Dose", match: "95% Match"},
                      {title: "Breadth First Search (BFS) - Algorithm + Examples", channel: "CodeHelp", match: "93% Match"},
                      {title: "Graph Traversal Algorithms Explained Simply", channel: "Jenny's Lectures CS/IT", match: "91% Match"},
                      {title: "DFS vs BFS - Difference Between Both", channel: "Take U Forward", match: "89% Match"},
                    ].map((v, i) => (
                      <div key={i} className="video-card-small">
                        <div className="vid-placeholder">▶</div>
                        <h4>{v.title}</h4>
                        <p>{v.channel}</p>
                        <span className="match-badge">{v.match}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bottom-row">
                  <div className="weak-topics">
                    <div className="section-header">
                      <div>
                        <h3>Weak Topics</h3>
                        <p>Focus on these to improve your performance.</p>
                      </div>
                    </div>
                    <div className="weak-list">
                      <div className="weak-item">
                         <div className="wi-left">
                            <span className="wi-icon blue">🌲</span>
                            <div>
                               <h4>Trees</h4>
                               <p>60% Accuracy</p>
                            </div>
                         </div>
                         <button className="review-btn" onClick={() => setActiveNav('Course Curator')}>Review</button>
                      </div>
                      <div className="weak-item">
                         <div className="wi-left">
                            <span className="wi-icon green">DP</span>
                            <div>
                               <h4>Dynamic Programming</h4>
                               <p>58% Accuracy</p>
                            </div>
                         </div>
                         <button className="review-btn" onClick={() => setActiveNav('Course Curator')}>Review</button>
                      </div>
                      <div className="weak-item">
                         <div className="wi-left">
                            <span className="wi-icon pink">B</span>
                            <div>
                               <h4>Backtracking</h4>
                               <p>62% Accuracy</p>
                            </div>
                         </div>
                         <button className="review-btn" onClick={() => setActiveNav('Course Curator')}>Review</button>
                      </div>
                    </div>
                  </div>

                  <div className="upcoming-goals">
                     <div className="section-header">
                        <div>
                          <h3>Upcoming Goals</h3>
                          <p>Plan your learning ahead.</p>
                        </div>
                        <a href="#" className="view-all">View all</a>
                     </div>
                     <div className="goals-list">
                        <div className="goal-item">
                           <span className="gi-icon green">🎯</span>
                           <span>Finish Trees and BST</span>
                           <span className="gi-date">May 25, 2025</span>
                        </div>
                        <div className="goal-item">
                           <span className="gi-icon blue">📚</span>
                           <span>Complete DP Basics</span>
                           <span className="gi-date">May 28, 2025</span>
                        </div>
                        <div className="goal-item">
                           <span className="gi-icon purple">📝</span>
                           <span>Solve 20 MCQs</span>
                           <span className="gi-date">May 25, 2025</span>
                        </div>
                     </div>
                  </div>
                </div>
              </div>

              <div className="dashboard-right-col">
                <div className="ai-tutor-container">
                  <AITutorChat 
                    videoId={selectedTopic?.videoId || activeCourse?.chapters[0]?.topics[0]?.videoId || "hYv6BM2fWd8"} 
                    topicTitle={selectedTopic?.title || activeCourse?.chapters[0]?.topics[0]?.title || "Graph Traversal BFS"} 
                  />
                </div>
                
                <div className="recent-activity-card">
                   <h4>Recent Activity</h4>
                   <div className="activity-list">
                      <div className="act-item">
                         <div className="act-left"><span className="act-icon">▶</span> Watched Graph Traversal</div>
                         <span className="act-time">2 days ago</span>
                      </div>
                      <div className="act-item">
                         <div className="act-left"><span className="act-icon">📝</span> Solved 15 MCQs</div>
                         <span className="act-time">2 days ago</span>
                      </div>
                      <div className="act-item">
                         <div className="act-left"><span className="act-icon">✅</span> Completed Quiz on DFS</div>
                         <span className="act-time">3 days ago</span>
                      </div>
                   </div>
                  <a href="#" className="view-all-activity">View all activity</a>
                </div>

                <div className="quick-actions-card">
                   <h4>Quick Actions</h4>
                   <button className="quick-action-btn" onClick={() => setActiveNav('Course Curator')}><BookOpen size={16}/> Start New Topic</button>
                   <button className="quick-action-btn" onClick={() => setActiveNav('Course Curator')}><HelpCircle size={16}/> Take a Quiz</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: activeNav === 'Course Curator' ? 'block' : 'none', position: 'relative' }}>
             <div className="legacy-app-wrapper">
               ${afterReturn}
             </div>
          </div>
          
          {activeNav !== 'Dashboard' && activeNav !== 'Course Curator' && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <h3>{activeNav}</h3>
              <p>This module is under construction.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;

    fs.writeFileSync('app/page.tsx', beforeReturn + newReturn);
    console.log("SUCCESS");
} else {
    console.log("FAILED to find match");
}
