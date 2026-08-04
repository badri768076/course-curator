const fs = require('fs');

let page = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Remove AITutorChat from the main dashboard
const dashboardBotRx = /<div className="ai-tutor-container">[\s\S]*?<\/div>\s*<div className="recent-activity-card">/;
page = page.replace(dashboardBotRx, `<div className="recent-activity-card">`);

// 2. Remove the old Course View section (which I added for big video)
// Since the user wants the large video inside 'Course Curator', I'll remove my custom 'Course View' and adjust Course Curator.
const courseViewRx = /{activeNav === 'Course View' && \([\s\S]*?\)\s*}/;
page = page.replace(courseViewRx, '');

// Also change the nav button to just point to 'Course Curator'
page = page.replace(/setActiveNav\('Course View'\)/g, "setActiveNav('Course Curator')");

// 3. Remove the legacy sidebar inside Course Curator
const legacySidebarRx = /<aside className="sidebar">[\s\S]*?<\/aside>\s*<!-- Main Content -->\s*(<main className="main-content">)/;
page = page.replace(legacySidebarRx, `$1`);

// Oh wait, `<!-- Main Content -->` is JSX comment: `{/* Main Content */}`
page = page.replace(/<aside className="sidebar">[\s\S]*?<\/aside>\s*\{\/\*\s*Main Content\s*\*\/\}\s*(<main className="main-content">)/, `$1`);

// 4. Update the container class to remove the columns logic
page = page.replace(/className="dashboard-container"/g, `className="legacy-curator-container" style={{ width: '100%' }}`);

// Write back
fs.writeFileSync('app/page.tsx', page);

// 5. Update CSS grid for content-grid to make it massive
let css = fs.readFileSync('app/globals.css', 'utf8');
css = css.replace(/grid-template-columns: 1\.3fr 1fr;/, `grid-template-columns: 1fr;`); // Stack syllabus on top, or maybe keep 1fr 2fr?
// Let's make it grid-template-columns: 320px 1fr; so Syllabus is a thin column on left, Video is MASSIVE on right!
css = css.replace(/grid-template-columns: 1\.3fr 1fr;/, `grid-template-columns: 320px 1fr;`);

// What about video-container?
const rxGrid = /.video-container \{/;
css = css.replace(rxGrid, `.video-container {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) 380px;\n  gap: 1.5rem;\n  align-items: stretch;\n`);
fs.writeFileSync('app/globals.css', css);

console.log("PATCH 3 SUCCESS");
