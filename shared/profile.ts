export const demoProfile = {
  appName: 'VedaAI',
  userName: 'John Doe',
  assistantName: 'Lakshay',
  schoolName: 'Delhi Public School, Sector-4, Bokaro',
  schoolShortName: 'Delhi Public School',
  schoolSubtitle: 'Bokaro Steel City',
  subject: 'English',
  className: '5th',
  toolkitLabel: "AI Teacher's Toolkit",
  brandDomain: 'web-to-figma.design'
} as const;

export const mobileNavItems = [
  { label: 'Home', href: '/assignments' },
  { label: 'Assignments', href: '/assignments' },
  { label: 'Library', href: '/library' },
  { label: 'AI Toolkit', href: '/assignments/new' }
] as const;
