export interface ExternalResource {
  name: string;
  url: string;
  siteName: string;
  description: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  tasks: string[];
}

export interface SkillGuide {
  skillName: string;
  category: string;
  description: string;
  w3schoolsLink?: string;
  otherLinks: ExternalResource[];
  syllabus: RoadmapPhase[];
  practiceProject: {
    title: string;
    description: string;
    steps: string[];
  };
}

export const PREDEFINED_GUIDES: Record<string, SkillGuide> = {
  'React Frontend Development': {
    skillName: 'React Frontend Development',
    category: 'Programming',
    description: 'React is a popular declarative, component-based, and highly efficient JavaScript library for building modern user interfaces and single-page applications.',
    w3schoolsLink: 'https://www.w3schools.com/react/',
    otherLinks: [
      {
        name: 'React Official Documentation',
        url: 'https://react.dev',
        siteName: 'React.dev',
        description: 'The definitive guide to functional React, Hooks, state management, and modern component architectural design patterns.'
      },
      {
        name: 'freeCodeCamp React Tutorial',
        url: 'https://www.freecodecamp.org/news/tag/react/',
        siteName: 'freeCodeCamp',
        description: 'Comprehensive, project-based video lectures and code challenges for learning React from absolute zero.'
      },
      {
        name: 'MDN Web Docs: React Getting Started',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/React_getting_started',
        siteName: 'MDN Web Docs',
        description: 'Excellent conceptual background of React components, events, and styling methods.'
      }
    ],
    syllabus: [
      {
        phase: 'Phase 1',
        title: 'React Core Fundamentals',
        tasks: [
          'Master JSX syntax, element rendering, and standard expression embedding.',
          'Learn the difference between Functional Components and props management.',
          'Understand State (useState) and standard local state flows.'
        ]
      },
      {
        phase: 'Phase 2',
        title: 'Side Effects & API Data Integration',
        tasks: [
          'Understand the useEffect lifecycle dependency array to prevent infinite rendering loops.',
          'Integrate asynchronous fetch operations to update UI state with server data.',
          'Manage complex states with useMemo, useCallback, or useReducer Hooks.'
        ]
      },
      {
        phase: 'Phase 3',
        title: 'Global Architecture & Performance',
        tasks: [
          'Build custom Hooks to modularize reusable logic across screens.',
          'Implement Context API or Redux Toolkit for clean global state orchestration.',
          'Optimize rendering cycles using React.memo and lazy dynamic routing imports.'
        ]
      }
    ],
    practiceProject: {
      title: 'Interactive Kanban Swap Board',
      description: 'Build a multi-column card organizer displaying skills offered and skills wanted, allowing users to move items across status rows.',
      steps: [
        'Initialize state with categories and cards.',
        'Implement drag handlers to update status tags in the array state.',
        'Store card updates inside local persistence (localStorage).'
      ]
    }
  },
  'SEO & Copywriting': {
    skillName: 'SEO & Copywriting',
    category: 'Digital Marketing',
    description: 'Search Engine Optimization and premium copywriting focus on crafting copy that ranks at the top of Google search pages while maintaining highly persuasive conversion flows.',
    w3schoolsLink: 'https://www.w3schools.com/seo/',
    otherLinks: [
      {
        name: 'Google SEO Starter Guide',
        url: 'https://developers.google.com/search/docs/fundamentals/seo-starter-guide',
        siteName: 'Google Search Central',
        description: 'Google\'s official framework for rendering indexable pages, managing metadata, and structuring accessible crawling paths.'
      },
      {
        name: 'Moz Learning Center: Keyword Strategy',
        url: 'https://moz.com/learn/seo',
        siteName: 'Moz SEO Hub',
        description: 'A deep look into search volumes, difficulty parameters, search intent, and long-tail optimization mechanics.'
      }
    ],
    syllabus: [
      {
        phase: 'Phase 1',
        title: 'SEO & Typography Layouts',
        tasks: [
          'Master On-Page optimization including H1-H3 hierarchies, Title tags, and custom meta-descriptions.',
          'Research competitor keywords utilizing free tools like Google Trends or Keyword Planner.',
          'Understand search intent categories: informational, transactional, and navigational.'
        ]
      },
      {
        phase: 'Phase 2',
        title: 'Persuasive Copywriting Formulas',
        tasks: [
          'Master AIDA (Attention, Interest, Desire, Action) and PAS (Problem, Agitate, Solve) copywriting layouts.',
          'Draft compelling headlines with strong power words to boost organic Click-Through-Rates (CTR).',
          'Optimize copy for semantic indexing (LSI) without resorting to spammy keyword stuffing.'
        ]
      },
      {
        phase: 'Phase 3',
        title: 'Technical SEO & Conversion Metrics',
        tasks: [
          'Audit web speeds, core web vitals, mobile responsiveness, and clean XML sitemaps.',
          'Build natural high-quality backlinks via high-value content assets and guest articles.',
          'Measure bounce rates, session periods, and organic conversions in Google Analytics.'
        ]
      }
    ],
    practiceProject: {
      title: 'Conversion-Optimized Landing Page',
      description: 'Draft a fully structured, semantic web copy page targeting a local service, integrating custom title tags and strong CTAs.',
      steps: [
        'Research 10 target long-tail keywords.',
        'Implement the PAS formula in your sections to trigger a compelling hook.',
        'Write descriptive alt tags and structural heading hierarchies.'
      ]
    }
  },
  'Sourdough Baking': {
    skillName: 'Sourdough Baking',
    category: 'Cooking',
    description: 'The ancient art of baking artisan loaves using wild yeast, baker\'s math percentages, hydration balances, bulk fermentation, shaping, and Dutch oven heat physics.',
    w3schoolsLink: 'https://www.w3schools.com/',
    otherLinks: [
      {
        name: 'King Arthur Sourdough Starter Guide',
        url: 'https://www.kingarthurbaking.com/recipes/sourdough-starter-recipe',
        siteName: 'King Arthur Baking',
        description: 'A complete, trusted timeline detailing how to capture and feed wild yeast, maintain hydration, and gauge fermentation peaks.'
      },
      {
        name: 'Serious Eats: Sourdough Science',
        url: 'https://www.seriouseats.com/sourdough-baking-guides',
        siteName: 'Serious Eats',
        description: 'A detailed food science analysis covering gluten development, lactic acid content, and the physics of the oven spring.'
      }
    ],
    syllabus: [
      {
        phase: 'Phase 1',
        title: 'Starter Capture & Feeding',
        tasks: [
          'Cultivate wild yeast from flour and water over an 8-10 day cycle.',
          'Understand starter fermentation peaks, scent indicators, and float testing.',
          'Understand Baker\'s Percentages to scale ingredients accurately.'
        ]
      },
      {
        phase: 'Phase 2',
        title: 'Autolyse & Bulk Fermentation',
        tasks: [
          'Perform structural autolysis to pre-develop gluten bonds naturally.',
          'Perform standard stretch-and-fold series to build elastic dough structures.',
          'Monitor dough volume growth, bubble counts, and temperature variables.'
        ]
      },
      {
        phase: 'Phase 3',
        title: 'Shaping, Scoring & Hearth Physics',
        tasks: [
          'Shape dough with high surface tension for round boules or batards.',
          'Execute overnight cold retard to develop organic acetic sour notes.',
          'Execute deep, slanted scoring cuts to guide oven springs under high steam in a Dutch oven.'
        ]
      }
    ],
    practiceProject: {
      title: 'The Classic 75% Hydration Loaf',
      description: 'Document and bake a rustic sourdough boule using simple white bread flour, tracking bulk times against ambient room conditions.',
      steps: [
        'Feed starter 5 hours before bake to activate high-activity leveling.',
        'Track ambient temperature logs across 4 stretch-and-fold routines.',
        'Score and bake under closed steam for 20 minutes, followed by open hearth baking.'
      ]
    }
  },
  'Acoustic Guitar Basics': {
    skillName: 'Acoustic Guitar Basics',
    category: 'Music',
    description: 'Learn acoustic guitar foundations, including proper finger postures, tuning, fret navigation, open chord shapes, basic strumming intervals, and ear training.',
    w3schoolsLink: 'https://www.w3schools.com/',
    otherLinks: [
      {
        name: 'JustinGuitar Beginner Syllabus',
        url: 'https://www.justinguitar.com/',
        siteName: 'JustinGuitar',
        description: 'The world\'s most popular structured, friendly, and completely free acoustic guitar learning course.'
      },
      {
        name: 'Ultimate Guitar Tab Directory',
        url: 'https://www.ultimate-guitar.com/',
        siteName: 'Ultimate Guitar',
        description: 'A colossal repository of lyrics, chord diagrams, fingerpicking tabs, and interactive song sheets.'
      }
    ],
    syllabus: [
      {
        phase: 'Phase 1',
        title: 'Guitar Anatomy & Open Chords',
        tasks: [
          'Learn exact standard string tuning names (E-A-D-G-B-E) and pick handling.',
          'Build strong finger muscle memory for fundamental open shapes: A, C, D, E, G, Am, Dm, Em.',
          'Master clean chord changes without muting neighboring strings.'
        ]
      },
      {
        phase: 'Phase 2',
        title: 'Strumming Mechanics & Rhythm',
        tasks: [
          'Maintain steady 4/4 and 3/4 tempos with a physical metronome.',
          'Master the universal strumming pattern: Down, Down-Up, Up, Down-Up.',
          'Transition chords smoothly on the "and" subdivisions of the beat.'
        ]
      },
      {
        phase: 'Phase 3',
        title: 'Introduction to Fingerstyle & Tabs',
        tasks: [
          'Read standard guitar tablature, noting sliding, hammer-on, and pull-off symbols.',
          'Implement basic fingerpicking patterns, assigning the thumb to base strings.',
          'Learn basic transposition rules using a standard neck capo.'
        ]
      }
    ],
    practiceProject: {
      title: 'Three-Chord Medley performance',
      description: 'Learn and perform a complete 3-chord song (e.g. using G, C, D) at a steady tempo of 80 BPM with perfect transition transitions.',
      steps: [
        'Practice 1-minute chord changes to build muscle memory.',
        'Incorporate the metronome, tapping your foot in solid 4/4 sync.',
        'Record yourself and review for clear tones and accurate strumming.'
      ]
    }
  }
};

export function getSkillGuide(skillName: string, category: string): SkillGuide {
  // Check exact match first
  if (PREDEFINED_GUIDES[skillName]) {
    return PREDEFINED_GUIDES[skillName];
  }

  // Create a highly professional dynamic guide if not predefined
  const w3Link = getCategoryW3schoolsLink(category, skillName);

  return {
    skillName,
    category,
    description: `A study guide designed to help you master ${skillName}. Understanding the core rules, tools, and practices of ${category} will set a strong baseline for professional growth.`,
    w3schoolsLink: w3Link,
    otherLinks: getCategoryLinks(category, skillName),
    syllabus: [
      {
        phase: 'Phase 1',
        title: `Introduction & Fundamentals of ${skillName}`,
        tasks: [
          'Understand core definitions, specialized terminology, and basic equipment/tools.',
          'Establish a reliable daily practice setup and study configuration.',
          'Complete initial hands-on drills or exercises to build confidence.'
        ]
      },
      {
        phase: 'Phase 2',
        title: `Intermediate Methods & Best Practices`,
        tasks: [
          'Learn troubleshooting strategies for common mistakes and bottlenecks.',
          'Integrate workflow optimizations, advanced templates, or advanced shortcuts.',
          'Collaborate with peers to review exercises and exchange reviews.'
        ]
      },
      {
        phase: 'Phase 3',
        title: `Mastery & Portfolio Construction`,
        tasks: [
          'Design and execute a comprehensive capstone project showcasing your expertise.',
          'Publish your exercises to community channels or platforms for constructive feedback.',
          'Refine speed, elegance, and adaptability under complex conditions.'
        ]
      }
    ],
    practiceProject: {
      title: `The ${skillName} Capstone Exercise`,
      description: `Complete a comprehensive, self-designed project applying all core tools and theories learned throughout this ${category} course.`,
      steps: [
        'Define a specific objective, outlining required parameters and variables.',
        'Execute the build, practice routine, or content drafting process step-by-step.',
        'Submit your project for community review or record a demo explaining your choices.'
      ]
    }
  };
}

function getCategoryW3schoolsLink(category: string, skillName: string): string | undefined {
  const name = skillName.toLowerCase();
  
  if (category === 'Programming') {
    if (name.includes('python')) return 'https://www.w3schools.com/python/';
    if (name.includes('javascript') || name.includes('js')) return 'https://www.w3schools.com/js/';
    if (name.includes('sql') || name.includes('database')) return 'https://www.w3schools.com/sql/';
    if (name.includes('css')) return 'https://www.w3schools.com/css/';
    if (name.includes('html')) return 'https://www.w3schools.com/html/';
    if (name.includes('java') && !name.includes('javascript')) return 'https://www.w3schools.com/java/';
    if (name.includes('c++') || name.includes('cpp')) return 'https://www.w3schools.com/cpp/';
    if (name.includes('typescript') || name.includes('ts')) return 'https://www.w3schools.com/typescript/';
    return 'https://www.w3schools.com/react/'; // Fallback program link
  }
  
  if (category === 'Digital Marketing') {
    if (name.includes('seo')) return 'https://www.w3schools.com/seo/';
    if (name.includes('social') || name.includes('marketing')) return 'https://www.w3schools.com/spaces/';
  }

  if (category === 'Graphic Design') {
    if (name.includes('css') || name.includes('tailwind')) return 'https://www.w3schools.com/css/';
    if (name.includes('svg') || name.includes('canvas')) return 'https://www.w3schools.com/graphics/';
  }

  // W3Schools has courses for almost everything now, but let's provide a solid fallback to their main or search page
  return 'https://www.w3schools.com/';
}

function getCategoryLinks(category: string, skillName: string): ExternalResource[] {
  const links: ExternalResource[] = [];

  switch (category) {
    case 'Programming':
      links.push(
        {
          name: 'MDN Web Docs',
          url: 'https://developer.mozilla.org',
          siteName: 'MDN Web Docs',
          description: 'The absolute authority on JavaScript, HTML, CSS, and web platform standards.'
        },
        {
          name: 'freeCodeCamp Developer Hub',
          url: 'https://www.freecodecamp.org',
          siteName: 'freeCodeCamp',
          description: 'A free open-source interactive learning platform offering thousands of hours of development coursework.'
        }
      );
      break;
    case 'Digital Marketing':
      links.push(
        {
          name: 'Google Digital Garage',
          url: 'https://learndigital.withgoogle.com',
          siteName: 'Google Digital Garage',
          description: 'Free, high-quality digital marketing certificates and tools curated by Google experts.'
        },
        {
          name: 'HubSpot Academy',
          url: 'https://academy.hubspot.com',
          siteName: 'HubSpot Academy',
          description: 'Inbound marketing strategy, content design, SEO, and email marketing tutorials.'
        }
      );
      break;
    case 'Graphic Design':
      links.push(
        {
          name: 'Behance Design Gallery',
          url: 'https://www.behance.net',
          siteName: 'Behance',
          description: 'Browse professional creative artwork, typography projects, and product brand definitions for reference.'
        },
        {
          name: 'Figma Learn Portal',
          url: 'https://help.figma.com/hc/en-us/categories/360002051614-Learn-Figma',
          siteName: 'Figma Help Center',
          description: 'Official Figma masterclasses covering layouts, auto-layouts, components, and variables.'
        }
      );
      break;
    case 'Music':
      links.push(
        {
          name: 'MusicTheory.net Lessons',
          url: 'https://www.musictheory.net/lessons',
          siteName: 'Music Theory',
          description: 'Free interactive tutorials explaining scales, intervals, chord configurations, and key signatures.'
        },
        {
          name: 'Coursera Music Courses',
          url: 'https://www.coursera.org/browse/arts-and-humanities/music',
          siteName: 'Coursera Music',
          description: 'Structured university-level music history, songwriting, and notation instruction.'
        }
      );
      break;
    case 'Cooking':
      links.push(
        {
          name: 'Serious Eats Culinary Guides',
          url: 'https://www.seriouseats.com/culinary-guides-5117961',
          siteName: 'Serious Eats',
          description: 'Comprehensive, food-science backed articles explaining heat transfers, meat curing, and baking dynamics.'
        }
      );
      break;
    case 'Language Learning':
      links.push(
        {
          name: 'Duolingo Learning Hub',
          url: 'https://www.duolingo.com',
          siteName: 'Duolingo',
          description: 'Gamified vocabulary building, spelling prompts, and light sentence structure training.'
        },
        {
          name: 'Language Transfer courses',
          url: 'https://www.languagetransfer.org',
          siteName: 'Language Transfer',
          description: 'An exceptional, completely free audio series explaining language logic and structural matching.'
        }
      );
      break;
    case 'Fitness':
      links.push(
        {
          name: 'ExRx Exercise Directory',
          url: 'https://exrx.net',
          siteName: 'ExRx.net',
          description: 'Comprehensive exercise library mapping muscle targets to specific bodyweight or free-weight movements.'
        }
      );
      break;
    default:
      links.push(
        {
          name: 'Wikipedia Knowledge Base',
          url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(skillName)}`,
          siteName: 'Wikipedia',
          description: 'Read detailed background histories, definitions, and theories relating to this topic.'
        },
        {
          name: 'Google Search Resources',
          url: `https://www.google.com/search?q=${encodeURIComponent(skillName + ' learning guide tutorial')}`,
          siteName: 'Google',
          description: 'Find real-world tutorials, reviews, video explainers, and local directories.'
        }
      );
  }

  return links;
}
