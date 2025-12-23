// Import fetch for Node.js - with fallback for ES Module issues
let fetch;
try {
  fetch = require('node-fetch');
} catch (error) {
  console.warn('node-fetch not available, using global fetch or fallback');
  // Use global fetch if available (Node 18+)
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else {
    // Fallback for older Node versions
    fetch = async (url, options) => {
      console.warn('Fetch not available, using mock response');
      return {
        ok: false,
        status: 503,
        json: async () => ({ error: 'Fetch not available' })
      };
    };
  }
}
const { 
  mockSkillExtraction, 
  mockJobMatch, 
  mockJobAnalysis, 
  mockApplicationSuggestions 
} = require('./mockAI');

// Free AI service configuration
const FREE_AI_ENDPOINT = process.env.FREE_AI_ENDPOINT || 'https://api.free-ai-service.com/v1/chat/completions';
const FREE_AI_API_KEY = process.env.FREE_AI_API_KEY || 'demo-key';

// Initialize free AI client
let freeAIClient = null;
try {
  if (FREE_AI_API_KEY && FREE_AI_API_KEY !== 'demo-key') {
    freeAIClient = {
      endpoint: FREE_AI_ENDPOINT,
      apiKey: FREE_AI_API_KEY
    };
  }
} catch (error) {
  console.warn('Free AI client initialization failed:', error.message);
}

/**
 * Extract skills from text content (resume, bio, job description)
 * @param {string} content - Text content to analyze
 * @param {string} model - AI model to use ('open-source' or 'openai')
 * @returns {Promise<Array>} Array of extracted skills
 */
const extractSkills = async (content, model = 'open-source') => {
  try {
    console.log(`Using AI model: ${model}`);
    
    // Always use mock AI for open-source model (free)
    if (model === 'open-source') {
      console.log('Using open-source (mock) AI service');
      return mockSkillExtraction(content);
    }
    
    // Use OpenAI if specified and available
    if (model === 'openai' && freeAIClient) {
      console.log('Using OpenAI service');
      // OpenAI implementation would go here
      // For now, fallback to mock
      return mockSkillExtraction(content);
    }
    
    // Fallback to mock AI
    console.log('Falling back to mock AI service');
    return mockSkillExtraction(content);
  } catch (error) {
    console.error('Skill extraction error:', error);
    return mockSkillExtraction(content);
  }
};



/**
 * Calculate job-candidate match score based on skills and requirements
 * @param {Object} job - Job object with requirements
 * @param {Object} candidate - Candidate object with skills
 * @param {string} model - AI model to use ('open-source' or 'openai')
 * @returns {Promise<Object>} Match score and analysis
 */
const calculateJobMatch = async (job, candidate, model = 'open-source') => {
  try {
    const jobSkills = job.skills || [];
    const candidateSkills = candidate.skills || [];
    
    // Calculate basic skill match
    const matchingSkills = jobSkills.filter(skill => 
      candidateSkills.some(candidateSkill => 
        candidateSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(candidateSkill.toLowerCase())
      )
    );

    const skillMatchScore = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 0;

    // Use AI for advanced matching analysis if available
    if (model === 'openai' && freeAIClient) {
      const prompt = `
        Analyze the match between a job and a candidate based on the following information:
        
        Job Title: ${job.title}
        Job Description: ${job.description}
        Required Skills: ${jobSkills.join(', ')}
        Budget: $${job.budget?.min || 0} - $${job.budget?.max || 0}
        
        Candidate Skills: ${candidateSkills.join(', ')}
        Candidate Experience: ${candidate.experience || 'Not specified'}
        Candidate Bio: ${candidate.bio || 'Not provided'}
        
        Provide a JSON response with:
        - overallMatchScore (0-100)
        - skillMatchScore (0-100)
        - experienceMatchScore (0-100)
        - cultureFitScore (0-100)
        - reasoning (brief explanation)
        - recommendations (array of suggestions for improvement)
      `;

      const response = await fetch(freeAIClient.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${freeAIClient.apiKey}`
        },
        body: JSON.stringify({
          model: "free-model",
          messages: [
            {
              role: "system",
              content: "You are a job matching expert. Analyze job-candidate compatibility and return detailed scores and recommendations."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Free AI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content.trim();
      
      try {
        const analysis = JSON.parse(analysisText);
        return {
          overallMatchScore: analysis.overallMatchScore || skillMatchScore,
          skillMatchScore: analysis.skillMatchScore || skillMatchScore,
          experienceMatchScore: analysis.experienceMatchScore || 50,
          cultureFitScore: analysis.cultureFitScore || 50,
          matchingSkills,
          reasoning: analysis.reasoning || 'AI-enhanced skill matching analysis',
          recommendations: analysis.recommendations || [],
          aiEnhanced: true
        };
      } catch (parseError) {
        console.error('Error parsing AI analysis:', parseError);
        return {
          overallMatchScore: skillMatchScore,
          skillMatchScore,
          experienceMatchScore: 50,
          cultureFitScore: 50,
          matchingSkills,
          reasoning: 'Basic skill matching analysis (AI analysis failed)',
          recommendations: ['Consider adding more skills to improve matching'],
          aiEnhanced: false
        };
      }
    } else {
      // Use mock AI service for open-source model or when free AI is not available
      console.log('Using open-source (mock) AI service for job matching');
      return mockJobMatch(job, candidate);
    }
  } catch (error) {
    console.error('Job matching error:', error);
    return mockJobMatch(job, candidate);
  }
};

/**
 * Generate job recommendations for a candidate
 * @param {Object} candidate - Candidate profile
 * @param {Array} availableJobs - Array of available jobs
 * @param {number} limit - Number of recommendations to return
 * @returns {Promise<Array>} Array of recommended jobs with match scores
 */
const getJobRecommendations = async (candidate, availableJobs, limit = 10) => {
  try {
    const recommendations = [];

    for (const job of availableJobs) {
      const match = await calculateJobMatch(job, candidate);
      recommendations.push({
        job,
        match
      });
    }

    // Sort by overall match score (descending)
    recommendations.sort((a, b) => b.match.overallMatchScore - a.match.overallMatchScore);

    return recommendations.slice(0, limit);
  } catch (error) {
    console.error('Job recommendations error:', error);
    return [];
  }
};

/**
 * Analyze job description and extract key insights
 * @param {string} jobDescription - Job description text
 * @returns {Promise<Object>} Analysis results
 */
const analyzeJobDescription = async (jobDescription) => {
  try {
    if (!freeAIClient) {
      return mockJobAnalysis(jobDescription);
    }

    const prompt = `
      Analyze the following job description and provide insights:
      
      Job Description: "${jobDescription}"
      
      Return a JSON object with:
      - keyRequirements (array of main requirements)
      - experienceLevel (junior/mid/senior/lead)
      - industry (tech/finance/healthcare/etc.)
      - remoteFriendly (boolean)
      - salaryIndication (low/medium/high)
      - companyCulture (array of culture indicators)
      - growthOpportunities (boolean)
    `;

    const response = await fetch(freeAIClient.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freeAIClient.apiKey}`
      },
      body: JSON.stringify({
        model: "free-model",
        messages: [
          {
            role: "system",
            content: "You are a job analysis expert. Analyze job descriptions and extract key insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`Free AI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices[0].message.content.trim();
    
    try {
      return JSON.parse(analysisText);
    } catch (parseError) {
      console.error('Error parsing job analysis:', parseError);
      return {
        keyRequirements: [],
        experienceLevel: 'mid',
        industry: 'tech',
        remoteFriendly: false,
        salaryIndication: 'medium',
        companyCulture: [],
        growthOpportunities: true
      };
    }
  } catch (error) {
    console.error('Job description analysis error:', error);
    return mockJobAnalysis(jobDescription);
  }
};

/**
 * Generate personalized job application suggestions
 * @param {Object} job - Job object
 * @param {Object} candidate - Candidate profile
 * @returns {Promise<Object>} Application suggestions
 */
const generateApplicationSuggestions = async (job, candidate) => {
  try {
    if (!freeAIClient) {
      return mockApplicationSuggestions(job, candidate);
    }

    const prompt = `
      Generate personalized job application suggestions for a candidate applying to a job:
      
      Job: ${job.title} at ${job.company}
      Job Description: ${job.description}
      Required Skills: ${(job.skills || []).join(', ')}
      
      Candidate Skills: ${(candidate.skills || []).join(', ')}
      Candidate Experience: ${candidate.experience || 'Not specified'}
      
      Provide a JSON response with:
      - coverLetterTips (array of tips for cover letter)
      - skillHighlights (array of skills to emphasize)
      - experienceRelevance (how to present experience)
      - interviewPrep (array of interview preparation tips)
      - redFlags (array of potential concerns to address)
    `;

    const response = await fetch(freeAIClient.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freeAIClient.apiKey}`
      },
      body: JSON.stringify({
        model: "free-model",
        messages: [
          {
            role: "system",
            content: "You are a career coach. Provide personalized job application advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      })
    });

    if (!response.ok) {
      throw new Error(`Free AI API error: ${response.status}`);
    }

    const data = await response.json();
    const suggestionsText = data.choices[0].message.content.trim();
    
    try {
      return JSON.parse(suggestionsText);
    } catch (parseError) {
      console.error('Error parsing application suggestions:', parseError);
      return {
        coverLetterTips: ['Highlight relevant experience', 'Show enthusiasm for the role'],
        skillHighlights: candidate.skills || [],
        experienceRelevance: 'Focus on transferable skills',
        interviewPrep: ['Research the company', 'Prepare for technical questions'],
        redFlags: []
      };
    }
  } catch (error) {
    console.error('Application suggestions error:', error);
    return mockApplicationSuggestions(job, candidate);
  }
};

module.exports = {
  extractSkills,
  calculateJobMatch,
  getJobRecommendations,
  analyzeJobDescription,
  generateApplicationSuggestions
}; 