// lib/ai/fallbackGenerator.ts
// Dynamic, content-tailored curriculum and course outline generator

import { Course, Chapter, Topic, MindmapNode, MindmapEdge } from '@/types/ai-output';

interface CourseBlueprint {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  chapters: Array<{
    title: string;
    description: string;
    topics: Array<{
      title: string;
      description: string;
      videoQuery: string;
      estimatedDuration: number;
    }>;
  }>;
}

// ── Curated Real Learning Videos for Instant Fallbacks ──
const REAL_LEARNING_VIDEOS: Record<string, string> = {
  python: 'kqtD5dpn9C8',
  javascript: 'W6NZfCO5SIk',
  react: 'bMknfKXIFA8',
  html: 'kUMe1FH4CHE',
  css: '1PnVor36_40',
  next: 'ZVnjOPwW_EC',
  node: 'f2EqECiTBL8',
  typescript: 'BwuLxPH8IDs',
  machine: 'i_LwzRVP7bg', // Standalone Machine Learning course
  ml: 'i_LwzRVP7bg',
  ai: 'JMUxmLrFLDY',
  data: '8hly31xKli0',
  sql: 'HXV3zeRR3h4',
  git: 'RGOj5yH7evk',
  quantum: 'JhHMJCUmq28',
  security: 'inWWhr5tnEA',
  docker: 'fqMOX6JJhGo',
  algorithm: '8hly31xKli0',
  system: 'xpDnVSmGVd0',
  general: 'rfscVS0vtbw',
};

function resolveVideoId(topicText: string): string {
  const lower = topicText.toLowerCase();
  for (const [key, id] of Object.entries(REAL_LEARNING_VIDEOS)) {
    if (lower.includes(key)) {
      return id;
    }
  }
  return REAL_LEARNING_VIDEOS.general;
}

// ── Rich Curated Blueprints for Major Domains ──
const DOMAIN_BLUEPRINTS: Record<string, (topic: string) => CourseBlueprint> = {
  'machine learning': (topic) => ({
    title: `Mastering Machine Learning: From Foundations to MLOps`,
    description: `A comprehensive journey across supervised, unsupervised, and deep learning algorithms with real-world applications and model deployment.`,
    difficulty: 'intermediate',
    estimatedHours: 12,
    chapters: [
      {
        title: 'Foundations & Mathematics of Machine Learning',
        description: 'Understand linear algebra, probability, loss functions, and the core ML lifecycle.',
        topics: [
          { title: 'What is Machine Learning? Definitions & Paradigms', description: 'Core principles separating ML from traditional software, supervised vs unsupervised learning.', videoQuery: 'what is machine learning full guide tutorial', estimatedDuration: 25 },
          { title: 'Essential Math: Linear Algebra & Vectors', description: 'Matrix operations, dot products, and vector spaces used in ML algorithms.', videoQuery: 'linear algebra for machine learning basics', estimatedDuration: 30 },
          { title: 'The Machine Learning Lifecycle & Data Preparation', description: 'Data cleaning, feature scaling, normalization, and train-validation-test splits.', videoQuery: 'machine learning data preprocessing pipeline', estimatedDuration: 25 },
        ],
      },
      {
        title: 'Supervised Learning: Regression Models',
        description: 'Predict continuous variables using linear, multiple, and polynomial regression.',
        topics: [
          { title: 'Simple Linear Regression & Gradient Descent', description: 'Cost functions, mean squared error, and optimization through gradient descent.', videoQuery: 'linear regression and gradient descent explained', estimatedDuration: 30 },
          { title: 'Multiple Linear Regression & Feature Selection', description: 'Working with multivariate inputs, multicollinearity, and feature importance.', videoQuery: 'multiple linear regression machine learning', estimatedDuration: 25 },
          { title: 'Regularization Techniques: Ridge & Lasso (L1 vs L2)', description: 'Preventing overfitting through penalty parameters and sparsity.', videoQuery: 'ridge and lasso regularization explained', estimatedDuration: 25 },
        ],
      },
      {
        title: 'Classification Algorithms & Decision Trees',
        description: 'Classify categorical outcomes using probabilistic and boundary-based models.',
        topics: [
          { title: 'Logistic Regression & Sigmoid Decision Boundaries', description: 'Odds ratios, log-loss function, and binary vs multiclass classification.', videoQuery: 'logistic regression classification explained', estimatedDuration: 30 },
          { title: 'Decision Trees, Entropy & Information Gain', description: 'Tree splitting metrics: Gini impurity and information gain algorithms.', videoQuery: 'decision trees machine learning intuitive guide', estimatedDuration: 25 },
          { title: 'Ensemble Learning: Random Forests & Gradient Boosting', description: 'Bagging vs boosting, XGBoost, and hyperparameter tuning.', videoQuery: 'random forest and xgboost ensemble learning', estimatedDuration: 35 },
        ],
      },
      {
        title: 'Unsupervised Learning & Clustering',
        description: 'Discover hidden structures, groupings, and patterns in unlabeled data.',
        topics: [
          { title: 'K-Means Clustering & The Elbow Method', description: 'Centroid initialization, convergence, and picking the optimal number of clusters.', videoQuery: 'k means clustering machine learning tutorial', estimatedDuration: 25 },
          { title: 'Hierarchical Clustering & Dendrograms', description: 'Agglomerative vs divisive clustering and similarity metrics.', videoQuery: 'hierarchical clustering dendrogram explained', estimatedDuration: 25 },
          { title: 'Dimensionality Reduction with PCA (Principal Component Analysis)', description: 'Eigenvectors, variance retention, and high-dimensional visualization.', videoQuery: 'principal component analysis pca intuitive tutorial', estimatedDuration: 30 },
        ],
      },
      {
        title: 'Neural Networks & Deep Learning Foundations',
        description: 'Explore the building blocks of modern deep learning and neural computation.',
        topics: [
          { title: 'Perceptrons & Artificial Neural Network Architecture', description: 'Input layers, hidden representations, and non-linear activation functions.', videoQuery: 'neural networks deep learning from scratch', estimatedDuration: 35 },
          { title: 'Backpropagation & Loss Optimization', description: 'Chain rule of calculus in multi-layer gradient computation.', videoQuery: 'backpropagation calculus neural network visual', estimatedDuration: 35 },
          { title: 'Introduction to Convolutional & Transformer Architectures', description: 'Overview of spatial convolutional filters and attention mechanisms.', videoQuery: 'cnn and transformers deep learning overview', estimatedDuration: 40 },
        ],
      },
      {
        title: 'Model Evaluation, Validation & MLOps Deployment',
        description: 'Evaluate performance reliably and package models for production use.',
        topics: [
          { title: 'Evaluation Metrics: Confusion Matrix, ROC-AUC, F1-Score', description: 'Moving beyond raw accuracy to measure precision, recall, and false positive rates.', videoQuery: 'confusion matrix roc auc precision recall machine learning', estimatedDuration: 25 },
          { title: 'Cross-Validation & Hyperparameter Grid Search', description: 'K-fold validation, nested cross-validation, and automated parameter tuning.', videoQuery: 'k fold cross validation grid search python', estimatedDuration: 25 },
          { title: 'Deploying Machine Learning Models with FastAPI & Docker', description: 'Containerizing model artifacts, serving REST APIs, and monitoring inference.', videoQuery: 'deploy machine learning model fastapi docker', estimatedDuration: 40 },
        ],
      },
    ],
  }),

  'python': (topic) => ({
    title: `Complete Python Bootcamp: From Beginner to Professional`,
    description: `Master Python programming syntax, data structures, object-oriented design, functional programming, and practical modern scripting.`,
    difficulty: 'beginner',
    estimatedHours: 10,
    chapters: [
      {
        title: 'Python Fundamentals & Environment Setup',
        description: 'Install Python, configure VS Code, and master variables, types, and terminal execution.',
        topics: [
          { title: 'Python Setup, Syntax & Dynamic Typing', description: 'Running scripts, interpreter architecture, and primitive data types.', videoQuery: 'python setup and basic syntax tutorial', estimatedDuration: 25 },
          { title: 'Operators, String Manipulation & F-Strings', description: 'Formatting strings, arithmetic, logical comparisons, and slicing.', videoQuery: 'python string formatting and operators', estimatedDuration: 25 },
          { title: 'User Input, Type Conversion & Control Flow (If-Else)', description: 'Handling terminal inputs, casting types, and conditional logic.', videoQuery: 'python conditionals if elif else tutorial', estimatedDuration: 25 },
        ],
      },
      {
        title: 'Loops, Functions & Scope',
        description: 'Write clean, reusable modular code with iteration patterns and custom functions.',
        topics: [
          { title: 'For & While Loops with Range, Break and Continue', description: 'Loop iteration, loop controls, and sentinel values.', videoQuery: 'python for while loops explained', estimatedDuration: 25 },
          { title: 'Defining Functions, Parameters, and Return Values', description: 'Default arguments, keyword arguments, and clean function documentation.', videoQuery: 'python functions parameters return values', estimatedDuration: 30 },
          { title: 'Variable Scope, *args, **kwargs & Lambda Functions', description: 'Global vs local scope, variable positional arguments, and anonymous functions.', videoQuery: 'python args kwargs lambda functions tutorial', estimatedDuration: 30 },
        ],
      },
      {
        title: 'Core Data Structures: Collections & Mutability',
        description: 'Harness the power of Python lists, dictionaries, tuples, and sets.',
        topics: [
          { title: 'Lists, Indexing, Slicing & List Comprehensions', description: 'List mutations, sorting, filtering, and concise list comprehensions.', videoQuery: 'python list comprehensions tutorial', estimatedDuration: 30 },
          { title: 'Dictionaries & Hash Maps in Python', description: 'Key-value pairs, nested dictionaries, dictionary methods, and performance.', videoQuery: 'python dictionaries full tutorial', estimatedDuration: 30 },
          { title: 'Tuples, Sets, and Memory Efficiency', description: 'Immutability, set unions, intersections, and deduplication patterns.', videoQuery: 'python tuples and sets explained', estimatedDuration: 25 },
        ],
      },
      {
        title: 'Object-Oriented Programming (OOP) in Python',
        description: 'Model complex real-world systems with classes, inheritance, and encapsulation.',
        topics: [
          { title: 'Classes, Objects, and the __init__ Constructor', description: 'Self reference, instance variables, and class methods.', videoQuery: 'python oop classes objects constructor', estimatedDuration: 35 },
          { title: 'Inheritance, Super(), and Method Overriding', description: 'Building class hierarchies and extending parent behavior cleanly.', videoQuery: 'python inheritance super method overriding', estimatedDuration: 30 },
          { title: 'Dunder Magic Methods & Encapsulation', description: 'String representations (__str__, __repr__), operator overloading, and private properties.', videoQuery: 'python dunder methods magic methods', estimatedDuration: 30 },
        ],
      },
      {
        title: 'File Handling, Modules & Error Management',
        description: 'Build resilient scripts that read/write files and handle runtime failures safely.',
        topics: [
          { title: 'Exception Handling: Try, Except, Finally, and Custom Errors', description: 'Catching runtime errors and writing robust exception handlers.', videoQuery: 'python error handling try except finally', estimatedDuration: 25 },
          { title: 'Working with Files, Context Managers (With), and JSON', description: 'Reading, writing, and parsing text and JSON files using context managers.', videoQuery: 'python file handling json context manager', estimatedDuration: 30 },
          { title: 'Virtual Environments, Pip, and Creating Packages', description: 'Managing dependencies with venv, requirements.txt, and organizing modules.', videoQuery: 'python virtual environments venv pip tutorial', estimatedDuration: 30 },
        ],
      },
    ],
  }),

  'react': (topic) => ({
    title: `Modern React & Next.js: Complete Frontend Architect Path`,
    description: `Build reactive, scalable web applications with React 18+, Hooks, component design systems, and modern full-stack workflows.`,
    difficulty: 'intermediate',
    estimatedHours: 10,
    chapters: [
      {
        title: 'React Fundamentals & Component Architecture',
        description: 'JSX structure, component lifecycles, and modern unidirectional data flow.',
        topics: [
          { title: 'JSX Syntax, Virtual DOM & Functional Components', description: 'How React converts JSX to Virtual DOM nodes and manages reconciliation.', videoQuery: 'react functional components and jsx tutorial', estimatedDuration: 25 },
          { title: 'Props, Composition & Conditional Rendering', description: 'Passing data downwards, children props, and rendering logic.', videoQuery: 'react props composition conditional rendering', estimatedDuration: 25 },
          { title: 'Handling Events & Interactive UI States', description: 'Synthetic events, event delegation, and form input controls.', videoQuery: 'react event handling forms tutorial', estimatedDuration: 25 },
        ],
      },
      {
        title: 'State Management & Core Hooks',
        description: 'Master useState, useEffect, and functional reactivity patterns.',
        topics: [
          { title: 'useState: State Primitives & Batching', description: 'Managing atomic UI states, functional updates, and immutability.', videoQuery: 'react usestate hook in depth tutorial', estimatedDuration: 30 },
          { title: 'useEffect: Side Effects, Subscriptions & Cleanups', description: 'Connecting to external APIs, dependency arrays, and lifecycle cleanups.', videoQuery: 'react useeffect complete guide cleanups', estimatedDuration: 35 },
          { title: 'useRef & Accessing DOM Elements', description: 'Mutable references without re-renders and direct DOM control.', videoQuery: 'react useref hook practical examples', estimatedDuration: 25 },
        ],
      },
      {
        title: 'Advanced Hooks & Performance Optimization',
        description: 'Optimize rendering cycles, build custom hooks, and manage global contexts.',
        topics: [
          { title: 'useMemo & useCallback: Preventing Redundant Re-renders', description: 'Memoizing expensive calculations and stable callback references.', videoQuery: 'usememo and usecallback react performance', estimatedDuration: 30 },
          { title: 'useContext & Global State Architecture', description: 'Eliminating prop-drilling with Context Providers and state dispatchers.', videoQuery: 'react context api state management tutorial', estimatedDuration: 30 },
          { title: 'Designing Reusable Custom Hooks', description: 'Abstracting stateful logic into clean, reusable utility hooks.', videoQuery: 'building custom react hooks tutorial', estimatedDuration: 30 },
        ],
      },
      {
        title: 'Routing, Server State & Full-Stack Next.js',
        description: 'Modern client and server components, API integration, and routing.',
        topics: [
          { title: 'Next.js App Router, Layouts & Server Components', description: 'Server-side rendering, streaming, and modern directory structures.', videoQuery: 'nextjs app router server components tutorial', estimatedDuration: 35 },
          { title: 'Data Fetching, Cache Revalidation & Server Actions', description: 'Fetching data without useEffect using server actions and suspense.', videoQuery: 'nextjs server actions data fetching tutorial', estimatedDuration: 35 },
          { title: 'Building Production Component Libraries & UI Design Systems', description: 'Compound components, accessibility (a11y), and responsive styling.', videoQuery: 'building production design system react components', estimatedDuration: 35 },
        ],
      },
    ],
  }),
};

// ── Generic Dynamic Curriculum Builder for Any Custom Topic ──
function generateDynamicCustomBlueprint(topic: string): CourseBlueprint {
  const cleanTopic = topic.trim();
  const lower = cleanTopic.toLowerCase();

  // Dynamically calculate chapters based on topic characteristics (4 to 6 chapters)
  const seed = cleanTopic.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const chapterCount = 4 + (seed % 3); // 4, 5, or 6 chapters dynamically

  const moduleTemplates = [
    {
      title: `Foundations & Core Principles of ${cleanTopic}`,
      description: `Understand the fundamental mental models, terminology, and core principles governing ${cleanTopic}.`,
      topics: [
        { title: `Introduction to ${cleanTopic}: Overview & Core Concepts`, description: `What is ${cleanTopic}, why it was created, and the primary problems it addresses.`, videoQuery: `${cleanTopic} beginner introduction crash course`, estimatedDuration: 25 },
        { title: `Key Architecture & Terminology in ${cleanTopic}`, description: `Essential vocabulary, internal structure, and conceptual frameworks.`, videoQuery: `${cleanTopic} architecture and core concepts explained`, estimatedDuration: 30 },
        { title: `Setting Up the Environment & First Hands-On Steps`, description: `Tooling, configurations, and building your first practical demonstration.`, videoQuery: `${cleanTopic} setup and getting started tutorial`, estimatedDuration: 25 },
      ],
    },
    {
      title: `Core Mechanics & Fundamental Workflows in ${cleanTopic}`,
      description: `Explore the underlying mechanisms, standard operations, and daily workflows.`,
      topics: [
        { title: `Standard Operations & Data Flow in ${cleanTopic}`, description: `How information, signals, or states move through the system step by step.`, videoQuery: `${cleanTopic} core mechanics and workflow tutorial`, estimatedDuration: 30 },
        { title: `Working with Tools, Syntax & Essential Components`, description: `Practical techniques and essential APIs used by modern practitioners.`, videoQuery: `${cleanTopic} practical tools and syntax walkthrough`, estimatedDuration: 30 },
        { title: `Common Patterns & Structured Implementations`, description: `Industry-standard design patterns and idioms for clean execution.`, videoQuery: `${cleanTopic} design patterns and practical examples`, estimatedDuration: 35 },
      ],
    },
    {
      title: `Hands-On Implementation & Practical Examples`,
      description: `Deep dive into real-world code, interactive case studies, and practical workflows.`,
      topics: [
        { title: `Building a Complete Practical Project with ${cleanTopic}`, description: `End-to-end walkthrough applying foundational knowledge to solve a real task.`, videoQuery: `${cleanTopic} full project build tutorial step by step`, estimatedDuration: 40 },
        { title: `Handling Edge Cases, Exceptions & Boundary Conditions`, description: `Identifying common pitfalls, error states, and building resilient workflows.`, videoQuery: `${cleanTopic} error handling common mistakes best practices`, estimatedDuration: 30 },
        { title: `Testing, Debugging & Verification Strategies`, description: `How to test components, inspect states, and debug tricky problems.`, videoQuery: `${cleanTopic} debugging and testing guide`, estimatedDuration: 30 },
      ],
    },
    {
      title: `Advanced Techniques & Performance Optimization`,
      description: `Scale your understanding with advanced configurations, internal mechanics, and efficiency.`,
      topics: [
        { title: `Advanced Features & Expert Patterns in ${cleanTopic}`, description: `High-leverage features and advanced paradigms used by senior engineers.`, videoQuery: `${cleanTopic} advanced concepts and deep dive tutorial`, estimatedDuration: 35 },
        { title: `Performance Tuning & Resource Optimization`, description: `Minimizing latency, reducing resource overhead, and measuring throughput.`, videoQuery: `${cleanTopic} performance optimization and benchmarks`, estimatedDuration: 30 },
        { title: `Security & Robustness Best Practices`, description: `Hardening systems against vulnerabilities and security lapses.`, videoQuery: `${cleanTopic} security best practices and hardening`, estimatedDuration: 30 },
      ],
    },
    {
      title: `Ecosystem Integration & Modern Industry Tooling`,
      description: `Integrate ${cleanTopic} with complementary libraries, frameworks, and tools.`,
      topics: [
        { title: `Third-Party Tooling, Libraries & Ecosystem Extensions`, description: `Popular extensions, community tooling, and seamless integrations.`, videoQuery: `${cleanTopic} ecosystem and popular libraries tutorial`, estimatedDuration: 30 },
        { title: `Automating Workflows & CI/CD Pipelines`, description: `Streamlining builds, automated testing, and release cycles.`, videoQuery: `${cleanTopic} automation and CI CD integration`, estimatedDuration: 30 },
        { title: `Scaling Systems & Multi-Environment Configuration`, description: `Managing staging, production, and distributed setups.`, videoQuery: `${cleanTopic} production deployment and scaling`, estimatedDuration: 35 },
      ],
    },
    {
      title: `Production Deployment, Architecture & Capstone Mastery`,
      description: `Synthesize your knowledge with production deployment and architectural mastery.`,
      topics: [
        { title: `Production Deployment Strategies & Monitoring`, description: `Live deployment, telemetry, logging, and observability in production.`, videoQuery: `${cleanTopic} production deployment and monitoring`, estimatedDuration: 35 },
        { title: `Real-World Case Studies & Architectural Trade-offs`, description: `Analyzing real production architectures, trade-offs, and lessons learned.`, videoQuery: `${cleanTopic} real world architecture case study`, estimatedDuration: 35 },
        { title: `Capstone Project & Continued Learning Roadmap`, description: `Review of key takeaways, capstone project guidelines, and next frontiers.`, videoQuery: `${cleanTopic} comprehensive review and future roadmap`, estimatedDuration: 30 },
      ],
    },
  ];

  return {
    title: `Mastering ${cleanTopic}: Complete Learning Curriculum`,
    description: `A comprehensive, progressive curriculum designed to take you from fundamentals to advanced production mastery in ${cleanTopic}.`,
    difficulty: cleanTopic.length > 15 ? 'intermediate' : 'beginner',
    estimatedHours: chapterCount * 2,
    chapters: moduleTemplates.slice(0, chapterCount),
  };
}

// ============================================
// MAIN DYNAMIC COURSE GENERATOR
// ============================================

export function generateFallbackCourse(topic: string): Course {
  const cleanTopic = topic.trim();
  const lower = cleanTopic.toLowerCase();

  // 1. Pick matching domain blueprint or generate tailored custom blueprint
  let blueprint: CourseBlueprint;
  const matchedKey = Object.keys(DOMAIN_BLUEPRINTS).find((key) => lower.includes(key));

  if (matchedKey) {
    blueprint = DOMAIN_BLUEPRINTS[matchedKey](cleanTopic);
  } else {
    blueprint = generateDynamicCustomBlueprint(cleanTopic);
  }

  const slug = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const course: Course = {
    id: `course-${slug}-${Date.now()}`,
    slug,
    title: blueprint.title,
    description: blueprint.description,
    difficulty: blueprint.difficulty,
    estimatedHours: blueprint.estimatedHours,
    chapters: [],
    mindmap: { nodes: [], edges: [] },
    generatedAt: new Date().toISOString(),
  };

  // 2. Build Chapters & Topics
  blueprint.chapters.forEach((chBlueprint, i) => {
    const chapterOrder = i + 1;
    const chapter: Chapter = {
      id: `ch-${chapterOrder}`,
      title: `Chapter ${chapterOrder}: ${chBlueprint.title}`,
      description: chBlueprint.description,
      order: chapterOrder,
      topics: chBlueprint.topics.map((tBlueprint, j) => {
        const topicOrder = j + 1;
        const topicSlug = tBlueprint.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
          id: `t-${chapterOrder}-${topicOrder}`,
          slug: topicSlug,
          title: tBlueprint.title,
          description: tBlueprint.description,
          videoId: resolveVideoId(`${cleanTopic} ${tBlueprint.title}`),
          videoQuery: tBlueprint.videoQuery,
          estimatedDuration: tBlueprint.estimatedDuration,
          prerequisites: j > 0 ? [chBlueprint.topics[j - 1].title] : [],
          completed: false,
          order: topicOrder,
        };
      }),
    };

    course.chapters.push(chapter);
  });

  // 3. Build Mindmap
  const nodes: MindmapNode[] = [
    {
      id: 'root',
      slug,
      label: course.title,
      type: 'root',
      level: 0,
      children: [],
      metadata: {
        icon: '📚',
        color: '#8B5CF6',
        description: course.description,
      },
    },
  ];

  const edges: MindmapEdge[] = [];

  course.chapters.forEach((chapter, ci) => {
    const chapterNodeId = `chapter-${ci + 1}`;
    const chapterNode: MindmapNode = {
      id: chapterNodeId,
      slug: chapter.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: chapter.title,
      type: 'chapter',
      parentId: 'root',
      level: 1,
      children: [],
      metadata: {
        icon: '📖',
        color: '#3B82F6',
        description: chapter.description,
      },
    };

    nodes.push(chapterNode);
    edges.push({
      id: `edge-root-ch${ci + 1}`,
      source: 'root',
      target: chapterNodeId,
      type: 'direct',
    });

    nodes[0].children = nodes[0].children || [];
    nodes[0].children.push(chapterNodeId);

    chapter.topics.forEach((topicItem, ti) => {
      const topicNodeId = `topic-${ci + 1}-${ti + 1}`;
      const topicNode: MindmapNode = {
        id: topicNodeId,
        slug: topicItem.slug,
        label: topicItem.title,
        type: 'topic',
        parentId: chapterNodeId,
        level: 2,
        children: [],
        completed: false,
        metadata: {
          icon: '🎯',
          color: '#10B981',
          description: topicItem.description,
        },
      };

      nodes.push(topicNode);
      edges.push({
        id: `edge-ch${ci + 1}-t${ti + 1}`,
        source: chapterNodeId,
        target: topicNodeId,
        type: 'direct',
      });

      chapterNode.children = chapterNode.children || [];
      chapterNode.children.push(topicNodeId);
    });
  });

  course.mindmap = { nodes, edges };
  return course;
}