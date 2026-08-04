const fs = require('fs');

let content = fs.readFileSync('app/page.tsx', 'utf8');

// Replace the start of the video tab
content = content.replace(
    `                              {activeTab === 'video' && (
                                <div className="video-container">
                                  {selectedTopic.videoId ? (`,
    `                              {activeTab === 'video' && (
                                <div className="video-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '1rem', alignItems: 'stretch' }}>
                                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                    {selectedTopic.videoId ? (`
);

// Replace the end of the video tab
content = content.replace(
    `                                  {isAnalyzing && (
                                    <div className="analyzing-overlay">
                                      <div className="spinner" />
                                      <p>Analyzing video content...</p>
                                    </div>
                                  )}
                                </div>
                              )}`,
    `                                  {isAnalyzing && (
                                    <div className="analyzing-overlay">
                                      <div className="spinner" />
                                      <p>Analyzing video content...</p>
                                    </div>
                                  )}
                                  </div> {/* End of video left col */}
                                  <div style={{ background: '#f8fafc', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                    <AITutorChat videoId={selectedTopic?.videoId} topicTitle={selectedTopic?.title} />
                                  </div>
                                </div>
                              )}`
);

fs.writeFileSync('app/page.tsx', content);
console.log("Replaced successfully!");
