const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Update the sidebar menu to contain the dynamic courses
let menuStartStr = `        <nav className="nav-menu">
          {[
            { id: 'Dashboard', icon: Home },`;
let oldMenuRegex = /<nav className="nav-menu">[\s\S]*?<\/nav>/;
let newMenu = `<nav className="nav-menu">
          {[
            { id: 'Dashboard', icon: Home },
            { id: 'My Learning', icon: BookOpen },
            { id: 'Course Curator', icon: PenTool },
            { id: 'AI Tutor', icon: Bot },
            { id: 'Quiz Zone', icon: HelpCircle },
            { id: 'Analytics', icon: BarChart2 },
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
          
          <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', paddingLeft: '1rem' }}>
             My Courses
          </div>
          {courses.length === 0 && (
             <div style={{ fontSize: '0.8rem', color: '#cbd5e1', paddingLeft: '1rem' }}>No courses yet</div>
          )}
          {courses.map(course => (
             <button
                key={course.id}
                className={\`nav-item \${activeCourse?.id === course.id && activeNav === 'Course View' ? 'active' : ''}\`}
                 onClick={() => {
                    setActiveCourse(course.id);
                    setActiveNav('Course View');
                 }}
                 style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: '1rem' }}
                 title={course.title}
             >
                <Bookmark size={14} style={{flexShrink: 0}} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</span>
             </button>
          ))}
        </nav>`;
content = content.replace(oldMenuRegex, newMenu);

// 2. Add Course View layout
// Let's add Course View to the dynamic blocks.
const dashboardGridStart = `{activeNav === 'Dashboard' && (`;
const dashboardGridEndRegex = /<\/div>\s*\}\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
// Actually, it's easier to replace `{activeNav === 'Dashboard' && (` and append the new Course View block next to it.
const legacyAppBlock = `{activeNav !== 'Dashboard' && activeNav !== 'Course Curator' && (`;

const courseViewBlock = `
          {activeNav === 'Course View' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>{activeCourse?.title || "Course"}</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={() => setActiveNav('Course Curator')} className="continue-btn" style={{ background: '#3b82f6', color: 'white' }}>Syllabus Map</button>

                  <button className="continue-btn" onClick={() => {
                    const tutor = document.getElementById('floating-tutor');
                    if(tutor) tutor.style.display = tutor.style.display === 'none' ? 'flex' : 'none';
                  }}>🤖 Toggle AI Tutor</button>
                </div>
              </div>

              <div style={{ flex: 1, background: '#000', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                 {selectedTopic?.videoId ? (
                   <iframe
                     width="100%"
                     height="100%"
                     src={\`https://www.youtube.com/embed/\${selectedTopic.videoId}?autoplay=1\`}
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                     allowFullScreen
                   ></iframe>
                 ) : (
                    <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem' }}>
                       <h3>No Video Selected</h3>
                       <p>Select a topic from the Syllabus Map to watch the video here.</p>
                       <button onClick={() => setActiveNav('Course Curator')} className="continue-btn" style={{ background: '#3b82f6', color: 'white' }}>Open Syllabus Module</button>
                    </div>
                 )}
                 
                 {/* Floating Chatbot */}
                 <div id="floating-tutor" style={{ display: 'none', position: 'absolute', top: '1rem', right: '1rem', width: '380px', height: '90%', background: 'white', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 10, overflow: 'hidden', flexDirection: 'column' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid #eee' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem' }}>AI Tutor</h3>
                      <button onClick={(e) => e.currentTarget.parentElement.parentElement.style.display = 'none'} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                   </div>
                   <div style={{ flex: 1, overflow: 'hidden' }}>
                      <AITutorChat videoId={selectedTopic?.videoId} topicTitle={selectedTopic?.title} />
                   </div>
                 </div>
              </div>
            </div>
          )}
`;
content = content.replace(legacyAppBlock, courseViewBlock + '\n          ' + legacyAppBlock);

// 3. Update dashboard stats
let dashboardGrid = content;
const totalTopics = `Object.keys(progress).length`; // Rough proxy for topics completed
const completedTopics = `Object.values(progress).filter(p => p?.completed).length`;
const mcqScores = `Object.values(progress).map(p => p?.quizScore).filter(s => s !== undefined && s > -1)`;
const mcqAvg = `mcqScores.length > 0 ? Math.round(mcqScores.reduce((a,b)=>a+b,0) / mcqScores.length) : 0`;
// Wait, I can't put literal JS inside string replace if it's evaluated in component render. I'll inject the calculation into the component body.
content = content.replace("const activeCourse = courses.find(c => c.id === activeCourseId);", `const activeCourse = courses.find(c => c.id === activeCourseId);
  const completedTopicsCount = Object.values(progress).filter(p => p?.completed).length;
  const mcqScores = Object.values(progress).map(p => p?.quizScore).filter(s => s !== undefined && s > -1);
  const mcqAvg = mcqScores.length > 0 ? Math.round(mcqScores.reduce((a,b)=>a+b,0) / mcqScores.length) : 0;
`);

// 4. Update the text in the dashboard to use the dynamics
content = content.replace("<strong>48.6 hrs</strong>", "<strong>{(totalTimeSpent / 3600).toFixed(1)} hrs</strong>");
content = content.replace("<strong>26</strong>", "<strong>{completedTopicsCount}</strong>");
content = content.replace("<strong>82%</strong>", "<strong>{mcqAvg}%</strong>");

fs.writeFileSync('app/page.tsx', content);
console.log("SUCCESS");
