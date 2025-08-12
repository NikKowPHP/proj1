export const getRoleRefinementPrompt = (role: string) => `
      You are an expert career coach and technical recruiter. Your task is to take a user-provided job role and refine it into several standardized, professional job titles. For each title, provide a concise, one-paragraph description of the role's primary responsibilities.

      The user-provided role is: "${role}".

      Please generate 3 distinct and relevant variations. If the input is very specific, you can provide fewer, more focused options. If the input is vague or nonsensical, provide common, related roles.

      Your response MUST be a single raw JSON array of objects, without any markdown formatting or surrounding text. Each object in the array should have the following structure:
      {
        "name": "The standardized, professional job title.",
        "description": "A one-paragraph summary of the role's key responsibilities, suitable for a user to understand what the job entails."
      }

      Example for user input "php dev":
      [
        {
          "name": "Junior PHP Developer (Laravel)",
          "description": "Focuses on developing and maintaining web applications using the PHP language and the Laravel framework. Responsibilities include writing server-side logic, integrating front-end elements, managing databases, and collaborating with a team to deliver high-quality software solutions under supervision."
        },
        {
          "name": "Backend Web Developer (PHP)",
          "description": "Specializes in server-side development using PHP. This role involves building and maintaining the technology that powers the components which, together, enable the user-facing side of the website to exist. Key tasks include database management, API development, and ensuring server performance and scalability."
        },
        {
          "name": "Full-Stack Developer (LAMP Stack)",
          "description": "Works on both the front-end and back-end of applications built on the LAMP (Linux, Apache, MySQL, PHP) stack. This role requires a broad skill set, including user interface design, server-side scripting with PHP, and database administration with MySQL, to build complete web solutions."
        }
      ]

      Now, process the role "${role}" and provide ONLY the JSON array as your response.
    `;
