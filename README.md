# Course Curator AI

An intelligent adaptive learning platform that uses AI to generate personalized course syllabi with interactive mindmaps, curated video content, and adaptive quizzes.

## Features

- **AI-Powered Course Generation**: Enter any topic and get a complete, structured learning roadmap
- **Interactive Mindmaps**: Visual navigation through course modules and topics
- **Curated Video Content**: Automatic YouTube video integration for each topic
- **Adaptive MCQ Quizzes**: Interactive quizzes to test your knowledge
- **Progress Tracking**: Track completion status, quiz scores, and learning time
- **Beautiful UI**: Modern glassmorphic design with smooth animations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Custom CSS with CSS variables, glassmorphism effects
- **State Management**: Zustand
- **AI Integration**: Google Generative AI
- **Video Integration**: YouTube Search API, YouTube Transcript
- **Icons**: Lucide React
- **PPT Generation**: PptxGenJS

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd course-curator
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add:
```env
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

## Usage

### Development Mode

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Build the application:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## Project Structure

```
course-curator/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages
│   ├── api/             # API routes
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Main dashboard page
├── components/
│   ├── features/        # Feature-specific components
│   │   ├── flowchart/   # Flowchart components
│   │   ├── mcq/         # Quiz components
│   │   ├── mindmap/     # Mindmap components
│   │   ├── topic/       # Topic-specific components
│   │   └── video/       # Video player components
│   ├── providers/       # Context providers
│   └── ui/              # Reusable UI components
├── actions/             # Server actions
├── constants/           # App constants
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── services/            # External service integrations
├── store/               # State management
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## How It Works

1. **Course Generation**: Users enter a topic, and the AI generates a structured syllabus with chapters and topics
2. **Mindmap Visualization**: The course structure is displayed as an interactive mindmap for easy navigation
3. **Video Integration**: Each topic is automatically matched with relevant YouTube videos
4. **Interactive Learning**: Users can watch videos, take quizzes, and track their progress
5. **Progress Tracking**: The app tracks completion status, quiz scores, and total learning time

## Key Components

- **MindmapRenderer**: Interactive SVG-based mindmap for course navigation
- **VideoPlayer**: Custom video player with transcript support
- **MCQ Quiz**: Adaptive multiple-choice questions for each topic
- **Progress Dashboard**: Visual progress tracking with statistics

## Styling

The application uses a custom design system with:
- CSS custom properties for theming
- Glassmorphism effects for cards
- Smooth animations and transitions
- Responsive grid layouts
- Custom scrollbars

## License

This project is private and proprietary.

## Contributing

This is a private project. For questions or support, please contact the development team.
