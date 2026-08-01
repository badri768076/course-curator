# Course Curator AI — Architecture and Folder Structure

This document explains the architecture of the project and how the main folders are organized.

---

## 1. Overall architecture

Course Curator AI is a modern Next.js application built around an intelligent learning experience. The architecture is divided into several layers:

1. Frontend layer
   - React + Next.js pages and components
   - interactive dashboards and topic learning views

2. State layer
   - Zustand store for course, progress, learning profile, and UI state

3. AI layer
   - server actions and service modules that generate course outlines and analyze video content

4. Media and content layer
   - YouTube video integration, transcripts, summaries, quizzes, mindmaps, and flowcharts

5. Persistence layer
   - local JSON storage for progress tracking and browser-based persistence

This structure allows the app to feel like a full adaptive learning platform rather than a static website.

---

## 2. High-level application flow

The app works like this:

1. A user enters a topic on the dashboard.
2. The AI layer generates a course structure for that topic.
3. The app stores the generated course in the global learning store.
4. The user opens a topic page and interacts with the content.
5. The app tracks video behavior, quiz progress, and learning style signals.
6. The system adapts the learning experience by showing different content views and explanations.

This creates a loop of:

- input → content generation → learning interaction → progress tracking → adaptation

---

## 3. Main architectural modules

### Frontend module
Located in the app folder and components folder.

Responsibilities:

- render pages such as dashboard, topic view, and authentication screens
- manage route-based navigation
- present interactive learning UI
- connect components to the global store

### AI orchestration module
Located in actions and services/ai.

Responsibilities:

- generate course outlines
- analyze videos
- create summaries, quizzes, and learning visuals
- handle API errors and fallback content

### State management module
Located in store.

Responsibilities:

- manage active course and topic
- store progress and quiz score data
- cache AI-generated video analysis
- track learning profile and adaptation signals

### Content and visualization module
Located in components/features.

Responsibilities:

- render mindmaps
- render flowcharts
- render adaptive panels
- render video player UI
- render quiz and study tools

### Utility and configuration module
Located in lib, config, constants, and types.

Responsibilities:

- helper functions
- environment configuration
- shared constants
- TypeScript interfaces and models

---

## 4. Folder structure

```text
course-curator/
├── app/                          # Next.js app router pages and routes
│   ├── (auth)/                   # Authentication pages
│   ├── (dashboard)/              # Dashboard-related pages
│   ├── api/                      # API routes
│   └── globals.css               # Global styles
├── actions/                      # Server actions for AI and content generation
├── components/                   # UI components
│   ├── features/                 # Feature-specific UI modules
│   │   ├── flowchart/            # Flowchart visualization
│   │   ├── mcq/                  # Quiz and AI feedback UI
│   │   ├── mindmap/              # Mindmap rendering
│   │   ├── topic/                # Topic content and navigation UI
│   │   └── video/                # Video player and adaptive learning UI
│   ├── providers/                # Context providers
│   └── ui/                       # Reusable UI primitives
├── config/                       # Environment/config helpers
├── constants/                    # App-wide constants and route definitions
├── data/                         # Local data files such as time tracking JSON
├── hooks/                        # Custom React hooks
├── lib/                          # Utility functions and generators
├── services/                     # External service integrations
│   ├── ai/                       # AI-related services
│   └── supabase/                 # Supabase client and auth helpers
├── store/                        # Zustand store definitions
├── types/                        # TypeScript interfaces and data models
├── public/                       # Static assets
├── package.json                  # Project dependencies and scripts
├── next.config.mjs               # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Main project documentation
```

---

## 5. Important folders and their purpose

### app/
This is the heart of the Next.js application. It contains:

- route-based page files
- authentication routes
- dashboard pages
- topic pages
- API routes

### actions/
This folder contains server actions used to trigger AI-driven features.

Examples:

- course generation
- video analysis

### components/
This folder contains all reusable and feature-specific UI components.

It is further divided into:

- features: logic-rich and domain-specific UI
- providers: app-level providers
- ui: simple building blocks such as cards, buttons, and inputs

### services/
This folder handles communication with external systems.

Examples include:

- AI service clients
- YouTube/video-related logic
- Supabase integration

### store/
This folder contains the global application state.

It is responsible for managing:

- currently active course
- active topic
- user progress
- learning profile
- cached results

### types/
This folder stores shared TypeScript models used across the application.

These models define:

- course structure
- quiz questions
- video analysis results
- learning profile shape

### lib/
This folder contains helper utilities and specialized generators.

Examples:

- local database helpers
- PPT generation logic
- general formatting or utility functions

---

## 6. Relationship between folders

A typical request in the app flows through multiple folders:

1. The user interacts with a page in app/
2. The page uses components from components/
3. The component reads or updates state from store/
4. If AI or external logic is needed, it calls actions/ or services/
5. Shared types and helpers come from types/ and lib/

This makes the project modular and easier to extend.

---

## 7. Why this structure is useful

The folder structure is designed to separate concerns clearly:

- app/ handles routing and pages
- components/ handles presentation
- store/ handles application state
- services/ handles external integrations
- actions/ handles AI workflow operations
- types/ keeps the data model consistent
- lib/ contains reusable logic

That separation is important because the project combines many different responsibilities.

---

## 8. Summary

The architecture of Course Curator AI is built around a modular, layered design:

- Next.js pages for app entry points
- React components for the UI
- Zustand for application state
- AI services for content generation
- feature-based components for educational experiences
- local persistence for progress tracking

This architecture supports the app’s goal of being an adaptive, AI-powered learning platform.
