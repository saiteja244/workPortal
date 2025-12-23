/**
 * Mock AI Service for Development
 * This provides free AI-like responses for development and testing
 */

const mockSkillExtraction = (content) => {
  const commonSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'MongoDB', 'PostgreSQL',
    'AWS', 'Docker', 'Git', 'TypeScript', 'Vue.js', 'Angular',
    'Express.js', 'Django', 'Flask', 'FastAPI', 'GraphQL', 'REST API',
    'HTML', 'CSS', 'SASS', 'Bootstrap', 'Tailwind CSS', 'Redux',
    'Next.js', 'Nuxt.js', 'Laravel', 'Spring Boot', 'Java', 'C#',
    'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Flutter',
    'React Native', 'TensorFlow', 'PyTorch', 'Machine Learning',
    'Data Science', 'DevOps', 'CI/CD', 'Kubernetes', 'Jenkins'
  ];

  const extractedSkills = [];
  const contentLower = content.toLowerCase();

  // Extract skills based on content
  commonSkills.forEach(skill => {
    if (contentLower.includes(skill.toLowerCase())) {
      extractedSkills.push(skill);
    }
  });

  // Add some random relevant skills if none found
  if (extractedSkills.length === 0) {
    const randomSkills = commonSkills.sort(() => 0.5 - Math.random()).slice(0, 3);
    extractedSkills.push(...randomSkills);
  }

  return extractedSkills.slice(0, 5); // Limit to 5 skills
};

const mockJobMatch = (job, candidate) => {
  const jobSkills = job.skills || [];
  const candidateSkills = candidate.skills || [];
  
  // Calculate skill match
  const matchingSkills = jobSkills.filter(skill => 
    candidateSkills.some(candidateSkill => 
      candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
      skill.toLowerCase().includes(candidateSkill.toLowerCase())
    )
  );
  
  const skillMatchScore = jobSkills.length > 0 ? 
    (matchingSkills.length / jobSkills.length) * 100 : 50;
  
  // Calculate experience match
  const experienceMatchScore = Math.min(100, Math.random() * 40 + 60);
  
  // Calculate overall match
  const overallMatchScore = Math.round((skillMatchScore * 0.6) + (experienceMatchScore * 0.4));
  
  return {
    overallMatchScore,
    skillMatchScore: Math.round(skillMatchScore),
    experienceMatchScore: Math.round(experienceMatchScore),
    cultureFitScore: Math.round(Math.random() * 30 + 70),
    reasoning: `Candidate has ${matchingSkills.length} matching skills out of ${jobSkills.length} required skills.`,
    recommendations: [
      'Highlight relevant project experience',
      'Emphasize transferable skills',
      'Show enthusiasm for the role'
    ],
    aiEnhanced: true
  };
};

const mockJobAnalysis = (jobDescription) => {
  const analysis = {
    keyRequirements: [],
    experienceLevel: 'mid',
    industry: 'tech',
    remoteFriendly: false,
    salaryIndication: 'medium',
    companyCulture: [],
    growthOpportunities: true
  };

  const descLower = jobDescription.toLowerCase();

  // Determine experience level
  if (descLower.includes('senior') || descLower.includes('lead') || descLower.includes('principal')) {
    analysis.experienceLevel = 'senior';
  } else if (descLower.includes('junior') || descLower.includes('entry') || descLower.includes('graduate')) {
    analysis.experienceLevel = 'junior';
  }

  // Determine remote friendliness
  if (descLower.includes('remote') || descLower.includes('work from home') || descLower.includes('wfh')) {
    analysis.remoteFriendly = true;
  }

  // Determine salary indication
  if (descLower.includes('competitive') || descLower.includes('high') || descLower.includes('excellent')) {
    analysis.salaryIndication = 'high';
  } else if (descLower.includes('entry') || descLower.includes('junior')) {
    analysis.salaryIndication = 'low';
  }

  // Extract key requirements
  const requirementKeywords = ['experience', 'knowledge', 'proficiency', 'familiarity', 'expertise'];
  requirementKeywords.forEach(keyword => {
    if (descLower.includes(keyword)) {
      analysis.keyRequirements.push(`Strong ${keyword} in relevant technologies`);
    }
  });

  // Add culture indicators
  if (descLower.includes('team') || descLower.includes('collaboration')) {
    analysis.companyCulture.push('Team-oriented');
  }
  if (descLower.includes('fast-paced') || descLower.includes('startup')) {
    analysis.companyCulture.push('Fast-paced environment');
  }

  return analysis;
};

const mockApplicationSuggestions = (job, candidate) => {
  return {
    coverLetterTips: [
      'Highlight relevant experience',
      'Show enthusiasm for the role',
      'Demonstrate cultural fit',
      'Address specific requirements'
    ],
    skillHighlights: candidate.skills?.slice(0, 3) || [],
    experienceRelevance: 'Focus on transferable skills and achievements',
    interviewPrep: [
      'Research the company thoroughly',
      'Prepare for technical questions',
      'Practice behavioral questions',
      'Have questions ready for the interviewer'
    ],
    redFlags: []
  };
};

module.exports = {
  mockSkillExtraction,
  mockJobMatch,
  mockJobAnalysis,
  mockApplicationSuggestions
}; 