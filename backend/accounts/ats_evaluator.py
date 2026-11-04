
import re


def normalize_skill(skill):
    """
    Convert a skill name into a consistent format.
    """
    return re.sub(r"\s+", " ", skill.strip().lower())


def extract_skills_from_text(text, skill_list):
    """
    Find known skills mentioned in a block of text.
    """
    text = text.lower()
    found_skills = []

    for skill in skill_list:
        normalized_skill = normalize_skill(skill)

        pattern = (
            r"(?<![a-z0-9+#.])"
            + re.escape(normalized_skill)
            + r"(?![a-z0-9+#.])"
        )

        if re.search(pattern, text):
            found_skills.append(skill)

    return found_skills


def evaluate_resume(resume_text, job):
    """
    Compare resume skills with the skills required by a job.

    Returns a transparent skill-match score and skill breakdown.
    """

    # Common technical skills recognized by our first ATS version.
    known_skills = [
        "Python",
        "Java",
        "JavaScript",
        "C",
        "C++",
        "C#",
        "PHP",
        "Django",
        "React",
        "Node.js",
        "HTML",
        "CSS",
        "Bootstrap",
        "Spring Boot",
        "Spring MVC",
        "Spring Security",
        "Hibernate",
        "REST APIs",
        "MySQL",
        "SQL",
        "PostgreSQL",
        "MongoDB",
        "SQLite",
        "Git",
        "GitHub",
        "Docker",
        "AWS",
        "Azure",
        "Linux",
        "Jenkins",
        "Kubernetes",
        "Machine Learning",
        "Data Structures",
        "Algorithms",
        "OOP",
        "Jest",
        "JUnit",
        "Mockito",
        "Postman",
        "Microservices",
        "TypeScript",
        "Angular",
        "Vue.js",
        "Express.js",
        "FastAPI",
        "Flask",
        "Redis",
        "GraphQL",
        "Next.js",
        "Tailwind CSS",
    ]

    # Combine the job description and requirements.
    job_text = f"{job.title} {job.description} {job.requirements}"

    # Extract skills from the resume and job.
    resume_skills = extract_skills_from_text(
        resume_text,
        known_skills,
    )

    required_skills = extract_skills_from_text(
        job_text,
        known_skills,
    )

    # Identify matching and missing skills.
    matched_skills = [
        skill for skill in required_skills
        if skill in resume_skills
    ]

    missing_skills = [
        skill for skill in required_skills
        if skill not in resume_skills
    ]

    # Calculate the skill-match percentage.
    if required_skills:
        score = round(
            len(matched_skills) / len(required_skills) * 100,
            2,
        )
    else:
        score = 0

    return {
        "ats_score": score,
        "total_required_skills": len(required_skills),
        "matched_count": len(matched_skills),
        "missing_count": len(missing_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "resume_skills": resume_skills,
        "required_skills": required_skills,
    }
