const fs = require('fs');

let page = fs.readFileSync('app/page.tsx', 'utf8');

const quizBlock = `
          {activeNav === 'Quiz Zone' && (
            <div className="legacy-curator-container" style={{ padding: '2rem', height: '100%', overflowY: 'auto' }}>
              <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', background: 'white', color: '#1e293b' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🎓 Course Master Quiz</h2>
                {!activeCourse ? (
                  <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: '#64748b' }}>Select a course from your left sidebar first to take its Master Quiz!</p>
                  </div>
                ) : (() => {
                  // Compile all questions for the active course
                  const allQuestions: any[] = [];
                  activeCourse.chapters.forEach(ch => {
                    ch.topics.forEach(t => {
                       const key = \`\${activeCourse.id}:\${t.slug}\`;
                       const analysis: any = videoAnalyses[key];
                       if (analysis && analysis.quiz) {
                         analysis.quiz.forEach((q: any) => {
                           allQuestions.push({ ...q, topicTitle: t.title });
                         });
                       }
                    });
                  });

                  if (allQuestions.length === 0) {
                     return (
                        <div style={{ textAlign: 'center', padding: '3rem' }}>
                          <p style={{ color: '#64748b' }}>No quizzes unlocked yet!</p>
                          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.5rem' }}>Go to Course Curator and analyze some videos to build up your Master Quiz.</p>
                          <button onClick={() => setActiveNav('Course Curator')} className="generate-btn" style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }}>Go to Course Curator</button>
                        </div>
                     );
                  }

                  return (
                     <div>
                       <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <p style={{ color: '#64748b' }}><strong>{allQuestions.length}</strong> questions compiled from your video sessions in <strong>{activeCourse.title}</strong>.</p>
                       </div>
                       
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                         {allQuestions.map((q, idx) => (
                           <div key={idx} style={{ padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                             <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, textTransform: 'uppercase' }}>From: {q.topicTitle}</span>
                             <h4 style={{ margin: '0.5rem 0 1rem 0' }}>{idx + 1}. {q.question}</h4>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                               {q.options.map((opt: string, oIdx: number) => {
                                  return (
                                    <label key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px', cursor: 'pointer' }}>
                                      <input type="radio" name={\`master-q\${idx}\`} value={oIdx} />
                                      <span>{opt}</span>
                                    </label>
                                  )
                               })}
                             </div>
                           </div>
                         ))}
                         <button className="generate-btn" onClick={() => alert('Quiz tracking for Master Quiz can be implemented with complex state! You did great.')}>Submit Master Quiz</button>
                       </div>
                     </div>
                  );
                })()}
              </div>
            </div>
          )}
`;

page = page.replace(
    /{activeNav !== 'Dashboard' && activeNav !== 'Course Curator' && \(/,
    quizBlock + "\n          {activeNav !== 'Dashboard' && activeNav !== 'Course Curator' && activeNav !== 'Quiz Zone' && ("
);

fs.writeFileSync('app/page.tsx', page);
console.log("SUCCESS Quiz Zone added");
