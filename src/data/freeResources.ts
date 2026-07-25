export interface CategoryResource {
  name: string;
  url: string;
  description: string;
  type?: 'Website' | 'YouTube' | 'Course' | 'Platform';
}

export const FREE_CATEGORY_RESOURCES: Record<string, CategoryResource[]> = {
  'Programming': [
    {
      name: 'freeCodeCamp',
      url: 'https://www.freecodecamp.org',
      description: 'Free interactive coding certifications, web development tutorials, and hands-on programming projects.',
      type: 'Platform'
    },
    {
      name: 'The Odin Project',
      url: 'https://www.theodinproject.com',
      description: 'A complete, free, open-source full-stack web development curriculum for beginners and advanced learners.',
      type: 'Course'
    },
    {
      name: 'CS50 by Harvard University',
      url: 'https://cs50.harvard.edu',
      description: 'Harvard University’s iconic entry-level computer science course covering algorithms, C, Python, SQL, and web dev.',
      type: 'Course'
    }
  ],
  'Graphic Design': [
    {
      name: 'Canva Design School',
      url: 'https://www.canva.com/designschool/',
      description: 'Free interactive design courses, graphic design fundamentals, typography tips, and branding tutorials.',
      type: 'Platform'
    },
    {
      name: 'DesignCourse',
      url: 'https://www.youtube.com/@DesignCourse',
      description: 'UI/UX design masterclasses, graphic design breakdowns, and frontend development tutorials on YouTube.',
      type: 'YouTube'
    },
    {
      name: 'Adobe Discover',
      url: 'https://www.adobe.com/products/photoshop/discover.html',
      description: 'Official step-by-step graphic design, photo editing, and creative cloud technique guides from Adobe.',
      type: 'Website'
    }
  ],
  'Video Editing': [
    {
      name: 'Peter McKinnon',
      url: 'https://www.youtube.com/@petermckinnon',
      description: 'Popular YouTube tutorials covering cinematic video editing techniques, Premiere Pro tips, and camera tricks.',
      type: 'YouTube'
    },
    {
      name: 'Justin Odisho',
      url: 'https://www.youtube.com/@JustinOdisho',
      description: 'In-depth video editing effects, Premiere Pro, After Effects, and creative workflow tutorials on YouTube.',
      type: 'YouTube'
    },
    {
      name: 'DaVinci Resolve Free Tutorials',
      url: 'https://www.blackmagicdesign.com/products/davinciresolve/training',
      description: 'Free official training videos and downloadable project files for color grading and video editing in DaVinci Resolve.',
      type: 'Website'
    }
  ],
  'Digital Marketing': [
    {
      name: 'HubSpot Academy',
      url: 'https://academy.hubspot.com',
      description: 'Free certifications and video lessons on inbound marketing, SEO, social media strategy, and content creation.',
      type: 'Course'
    },
    {
      name: 'Google Digital Garage',
      url: 'https://learndigital.withgoogle.com',
      description: 'Google’s free digital marketing fundamentals certificate program and online business growth modules.',
      type: 'Platform'
    }
  ],
  'Photography': [
    {
      name: 'Peter McKinnon',
      url: 'https://www.youtube.com/@petermckinnon',
      description: 'Engaging photography guides, camera gear breakdowns, lighting setups, and composition masterclasses on YouTube.',
      type: 'YouTube'
    },
    {
      name: 'Mango Street',
      url: 'https://www.youtube.com/@MangoStreet',
      description: 'Short, direct photography and filmmaking tutorials focusing on creative direction and visual storytelling.',
      type: 'YouTube'
    },
    {
      name: 'Photography Life',
      url: 'https://photographylife.com',
      description: 'Comprehensive technical articles, camera reviews, exposure guides, and landscape photography techniques.',
      type: 'Website'
    }
  ],
  'Music': [
    {
      name: 'Marty Music',
      url: 'https://www.youtube.com/@MartyMusic',
      description: 'The premier YouTube channel for beginner and intermediate guitar lessons, chord progressions, and song tabs.',
      type: 'YouTube'
    },
    {
      name: 'PianoTV',
      url: 'https://www.youtube.com/@PianoTV',
      description: 'Classical and modern piano lessons, sheet music reading, technique tips, and music history on YouTube.',
      type: 'YouTube'
    },
    {
      name: 'musictheory.net',
      url: 'https://www.musictheory.net',
      description: 'Free interactive music theory exercises, chord identification tools, scale diagrams, and ear training exercises.',
      type: 'Website'
    }
  ],
  'Fitness': [
    {
      name: 'Athlean-X',
      url: 'https://www.youtube.com/@athleanx',
      description: 'Science-based workout routines, injury prevention guides, biomechanics breakdowns, and strength training on YouTube.',
      type: 'YouTube'
    },
    {
      name: 'FitnessBlender',
      url: 'https://www.fitnessblender.com',
      description: 'Hundreds of free full-length workout videos, cardio routines, HIIT sessions, and healthy living plans.',
      type: 'Platform'
    },
    {
      name: 'Yoga with Adriene',
      url: 'https://www.youtube.com/@yogawithadriene',
      description: 'Welcoming, high-quality free yoga practices, mindfulness sessions, and flexibility routines for all fitness levels.',
      type: 'YouTube'
    }
  ],
  'Cooking': [
    {
      name: 'Joshua Weissman',
      url: 'https://www.youtube.com/@JoshuaWeissman',
      description: 'High-energy culinary tutorials, knife skill guides, restaurant dish recreations, and dough making on YouTube.',
      type: 'YouTube'
    },
    {
      name: 'Babish Culinary Universe',
      url: 'https://www.youtube.com/@babishculinaryuniverse',
      description: 'Step-by-step cooking tutorials reproducing iconic pop-culture dishes and foundational culinary techniques.',
      type: 'YouTube'
    },
    {
      name: 'Bon Appétit',
      url: 'https://www.youtube.com/@bonappetit',
      description: 'Test kitchen recipes, professional chef techniques, ingredient deep-dives, and seasonal cooking guides.',
      type: 'YouTube'
    }
  ],
  'Language Learning': [
    {
      name: 'Duolingo',
      url: 'https://www.duolingo.com',
      description: 'Gamified bite-sized language lessons, vocabulary drills, and listening exercises in over 40 languages.',
      type: 'Platform'
    },
    {
      name: 'BBC Languages',
      url: 'http://www.bbc.co.uk/languages/',
      description: 'Free audio & video courses, grammar guides, and essential phrases for multiple world languages.',
      type: 'Website'
    }
  ],
  'Public Speaking': [
    {
      name: 'Toastmasters International',
      url: 'https://www.toastmasters.org',
      description: 'World-renowned tips on speech writing, overcoming stage fright, body language, and effective leadership.',
      type: 'Website'
    },
    {
      name: 'Charisma on Command',
      url: 'https://www.youtube.com/@Charismaoncommand',
      description: 'YouTube breakdowns analyzing confident communication, persuasive speaking, and interpersonal charm.',
      type: 'YouTube'
    }
  ],
  'Business': [
    {
      name: 'Google Digital Garage',
      url: 'https://learndigital.withgoogle.com',
      description: 'Free courses on business strategy, digital transformation, leadership skills, and startup fundamentals.',
      type: 'Platform'
    },
    {
      name: 'Alison',
      url: 'https://alison.com',
      description: 'Free online diploma and certificate courses in business management, entrepreneurship, and operations.',
      type: 'Course'
    }
  ]
};

export function getResourcesForCategory(category: string): CategoryResource[] {
  if (FREE_CATEGORY_RESOURCES[category]) {
    return FREE_CATEGORY_RESOURCES[category];
  }
  // Fallback if category is 'All' or unknown: return a balanced mix from top categories
  return [
    ...FREE_CATEGORY_RESOURCES['Programming'],
    ...FREE_CATEGORY_RESOURCES['Digital Marketing'],
    ...FREE_CATEGORY_RESOURCES['Graphic Design']
  ];
}
