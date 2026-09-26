function extractSkills(text) {
  const skills = [
    // Frontend
    "JavaScript", "TypeScript", "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt.js", "HTML", "CSS", "Tailwind", "Bootstrap", "Material-UI", "jQuery", "Webpack", "Vite",
  
    // Backend
    "Node.js", "Express", "NestJS", "Django", "Flask", "Spring Boot", "Ruby on Rails", "PHP", "Laravel", "ASP.NET", "GraphQL", "REST API",
  
    // Databases
    "MongoDB", "MySQL", "PostgreSQL", "SQLite", "Redis", "Cassandra", "Firebase", "DynamoDB", "OracleDB",
  
    // Cloud & DevOps
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD", "Jenkins", "GitHub Actions", "CircleCI", "TravisCI", "Prometheus", "Grafana",
  
    // Programming Languages
    "Python", "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "R", "MATLAB", "Scala", "Perl", "Shell Scripting",
  
    // Data / Analytics / ML / AI
    "Pandas", "NumPy", "Scikit-learn", "TensorFlow", "PyTorch", "Keras", "Machine Learning", "Deep Learning", "Data Analysis", "Data Visualization", "PowerBI", "Tableau", "Big Data", "Hadoop", "Spark", "SQL Analytics", "NLP", "Computer Vision", "AI",
  
    // Testing / QA
    "Jest", "Mocha", "Chai", "Selenium", "Cypress", "JUnit", "TestNG", "Postman", "API Testing", "Load Testing", "Performance Testing",
  
    // Tools / Version Control / Project Management
    "Git", "GitHub", "GitLab", "Bitbucket", "Agile", "Scrum", "Kanban", "Jira", "Trello", "Figma", "Adobe XD", "Zeplin", "Slack",
  
    // Security
    "OAuth", "JWT", "SSL/TLS", "Penetration Testing", "Vulnerability Assessment", "Cybersecurity", "Encryption", "IAM",
  
    // Mobile
    "React Native", "Flutter", "Swift", "Kotlin", "Android", "iOS", "Xamarin",
  
    // Misc / Emerging
    "Blockchain", "Smart Contracts", "Solidity", "Web3", "NFT", "IoT", "Edge Computing", "Serverless", "Microservices", "Event-Driven Architecture", "API Development", "Cloud Functions"
  ];
  
  const lowerText = text.toLowerCase();
  return skills.filter(skill => lowerText.includes(skill.toLowerCase()));
}

export function analyzeAndHighlight(resumeText, jobText) {
  const resumeSkills = extractSkills(resumeText);
  const jobSkills = extractSkills(jobText);

  const presentSkills = jobSkills.filter(skill => resumeSkills.includes(skill));
  const missingSkills = jobSkills.filter(skill => !resumeSkills.includes(skill));

  // Only show skills in job description, highlighted
  const highlightedSkills = jobSkills.map(skill => {
    if (presentSkills.includes(skill)) {
      return `<span class="present-skill">${skill}</span>`;
    } else {
      return `<span class="missing-skill">${skill}</span>`;
    }
  }).join(", ");

  const feedback = [];
  if (presentSkills.length > 0) {
    feedback.push(`✅ Good: You already have ${presentSkills.join(", ")}.`);
  }
  if (missingSkills.length > 0) {
    feedback.push(`⚠️ Consider adding: ${missingSkills.join(", ")}.`);
  }

  return {
    feedback,
    highlightedJD: highlightedSkills, // Only skills shown here
    presentSkills,
    missingSkills
  };
}
