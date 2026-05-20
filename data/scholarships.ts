import type { Scholarship } from '@/lib/types'

export const scholarships: Scholarship[] = [
  {
    id: 'google-generation',
    name: 'Google Generation Scholarship',
    amount: '$10,000',
    deadline: 'December 1, 2026',
    eligibility: 'CS/tech majors, demonstrated leadership, academic excellence, US/Canada, sophomore+',
    description:
      'Supports aspiring computer scientists and technologists with financial need and demonstrated leadership in their communities.',
    prompts: [
      'Describe a technical project you have worked on and what you learned from it.',
      'How do you plan to use your computer science degree to make a positive impact on others?',
    ],
    tags: ['cs', 'google', 'leadership', 'tech'],
  },
  {
    id: 'microsoft-scholarship',
    name: 'Microsoft Scholarship Program',
    amount: '$5,000',
    deadline: 'January 15, 2027',
    eligibility: 'CS/engineering students, sophomore+, US, financial need, demonstrated interest in technology',
    description:
      'Microsoft scholarship for students studying computer science or a related STEM field with financial need and a passion for technology.',
    prompts: [
      'What inspired you to pursue a career in technology, and how has that motivation shaped your studies?',
      'Describe a time you demonstrated leadership in a technical or academic context.',
    ],
    tags: ['cs', 'microsoft', 'tech', 'stem'],
  },
  {
    id: 'palantir-impact',
    name: 'Palantir Impact Scholarship',
    amount: '$10,000',
    deadline: 'February 1, 2027',
    eligibility: 'Underrepresented students in STEM, US universities, sophomore+',
    description:
      'Supports students who are underrepresented in technology fields and have a demonstrated interest in solving complex problems with data and software.',
    prompts: [
      'Describe a problem you identified and how you approached solving it using technology or data.',
      'How do you see data and software changing your field of interest over the next decade?',
    ],
    tags: ['stem', 'palantir', 'data', 'underrepresented'],
  },
  {
    id: 'dell-scholars',
    name: 'Dell Scholars Program',
    amount: '$20,000',
    deadline: 'December 1, 2026',
    eligibility: 'First-gen or low-income college students, 2.4+ GPA, US citizens/permanent residents',
    description:
      'Comprehensive support program for students who have overcome challenging circumstances to pursue higher education, with a focus on persistence and resilience.',
    prompts: [
      'Describe the challenges you have faced in your path to and through college, and how you have overcome them.',
      'What are your academic and career goals, and how will this scholarship help you achieve them?',
    ],
    tags: ['first-gen', 'need-based', 'dell', 'resilience'],
  },
  {
    id: 'coca-cola-scholars',
    name: 'Coca-Cola Scholars Program Scholarship',
    amount: '$20,000',
    deadline: 'October 31, 2026',
    eligibility: 'Current undergraduates with demonstrated leadership and community service, 3.0+ GPA, US',
    description:
      'Recognizes students who lead and serve in their communities with exceptional scholarship records and a commitment to making a difference.',
    prompts: [
      'Describe your most meaningful leadership experience and what you learned from it.',
      'How have you made a measurable difference in your campus or broader community?',
      'What are your long-term goals and how will this scholarship accelerate them?',
    ],
    tags: ['leadership', 'community', 'coca-cola', 'service'],
  },
  {
    id: 'techpoint-indiana',
    name: 'TechPoint Foundation Scholarship',
    amount: '$3,500',
    deadline: 'March 15, 2027',
    eligibility: 'Indiana residents studying technology at an Indiana university, 3.0+ GPA, sophomore+',
    description:
      "Supports Indiana's tech talent pipeline by funding tech-focused students at Indiana colleges and universities who plan to stay and contribute to Indiana's economy.",
    prompts: [
      "Why did you choose to study technology in Indiana, and how do you plan to contribute to Indiana's tech ecosystem after graduation?",
      'Describe a technical project or initiative that reflects your skills and ambitions.',
    ],
    tags: ['indiana', 'tech', 'state-specific', 'workforce'],
  },
  {
    id: 'hudson-holland-continuing',
    name: 'Hudson & Holland Scholars Continuing Award',
    amount: '$2,000',
    deadline: 'April 1, 2027',
    eligibility: 'Current Hudson & Holland Scholars at IU, 3.0+ GPA, sophomore+',
    description:
      'Additional merit funding for continuing Hudson & Holland Scholars at Indiana University who demonstrate academic growth and contributions to the H&H scholar community.',
    prompts: [
      'How has the Hudson & Holland Scholars program shaped your IU experience and your vision for your future?',
      'Describe your contributions to the H&H community and how you have supported fellow scholars.',
    ],
    tags: ['iu', 'hudson-holland', 'indiana', 'merit'],
  },
  {
    id: 'ktp-foundation',
    name: 'Kappa Theta Pi Foundation Scholarship',
    amount: '$1,500',
    deadline: 'April 15, 2027',
    eligibility: 'Active members of Kappa Theta Pi (any chapter), 3.0+ GPA, sophomore+',
    description:
      'Scholarship awarded by the KTP Foundation to active members demonstrating academic excellence, chapter leadership, and commitment to the professional tech community.',
    prompts: [
      'How have you contributed to your KTP chapter and to the broader professional tech community?',
      'Describe a project or initiative you have led or significantly contributed to within KTP.',
    ],
    tags: ['ktp', 'fraternity', 'leadership', 'tech'],
  },
  {
    id: 'iu-luddy-merit',
    name: 'IU Luddy School of Informatics Merit Scholarship',
    amount: '$5,000',
    deadline: 'February 15, 2027',
    eligibility: 'Declared Luddy School students at IU Bloomington, 3.2+ GPA, sophomore or junior',
    description:
      "Merit-based scholarship for high-achieving students in IU's Luddy School of Informatics, Computing, and Engineering who demonstrate academic excellence and professional promise.",
    prompts: [
      'How does your academic work at the Luddy School align with your career goals in computing or informatics?',
      'Describe a project or experience that has most shaped your interest in the field.',
    ],
    tags: ['iu', 'luddy', 'merit', 'cs', 'indiana'],
  },
  {
    id: 'accenture-consulting',
    name: 'Accenture Technology & Consulting Scholarship',
    amount: '$5,000',
    deadline: 'January 31, 2027',
    eligibility: 'STEM students with interest in business and technology consulting, 3.0+ GPA, US universities',
    description:
      'Supports students at the intersection of technology and business who aspire to careers in technology-focused consulting. Preference for students with automation, AI, or data skills.',
    prompts: [
      'How do you see emerging technology reshaping the consulting industry over the next five years?',
      'Describe an experience where you used technology to solve a business or organizational problem.',
    ],
    tags: ['consulting', 'tech', 'accenture', 'business', 'ai'],
  },
  {
    id: 'lilly-endowment',
    name: 'Lilly Endowment Community Scholarship',
    amount: '$6,500/year',
    deadline: 'November 1, 2026',
    eligibility: 'Indiana residents attending Indiana colleges/universities, financial need, community engagement',
    description:
      "One of Indiana's largest private scholarship programs, supporting Indiana residents at Indiana institutions who demonstrate financial need and active community involvement.",
    prompts: [
      'Describe your involvement in your community and the impact you have made.',
      'How has growing up in Indiana shaped your goals, and how do you plan to give back to the state?',
    ],
    tags: ['indiana', 'need-based', 'lilly', 'community', 'state-specific'],
  },
  {
    id: 'generation-google-cs',
    name: 'Generation Google Scholarship: For Those Pursuing CS',
    amount: '$10,000',
    deadline: 'December 15, 2026',
    eligibility: 'Underrepresented students in CS, US/Canada, sophomore+, 3.0+ GPA',
    description:
      'Helps aspiring computer scientists from underrepresented groups excel in technology by reducing financial barriers and connecting scholars with Google mentors and resources.',
    prompts: [
      'How do you plan to use your CS degree to benefit others and drive positive change?',
      'Tell us about a time you used problem-solving skills to overcome a significant technical or personal challenge.',
    ],
    tags: ['google', 'cs', 'need-based', 'underrepresented', 'community'],
  },
]
