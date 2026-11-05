import re
from datetime import date


KNOWN_SKILLS = [
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


STOP_WORDS = {
    "a", "an", "and", "are", "as", "at", "be", "by",
    "for", "from", "has", "have", "in", "is", "it",
    "of", "on", "or", "our", "the", "to", "with",
    "we", "you", "your", "will", "work", "working",
    "role", "job", "candidate", "experience",
    "knowledge", "ability", "skills", "required",
    "requirements", "responsibilities",
}


EDUCATION_KEYWORDS = {
    "education",
    "degree",
    "bachelor",
    "bachelors",
    "master",
    "masters",
    "doctorate",
    "phd",
    "diploma",
    "graduate",
    "undergraduate",
    "qualification",
    "qualifications",
    "university",
    "college",
    "computer",
    "science",
    "engineering",
    "information",
    "technology",
    "mathematics",
    "statistics",
    "business",
    "management",
    "accounting",
    "finance",
    "economics",
}


def normalize_skill(skill):
    """Normalize a skill name for consistent comparison."""

    return re.sub(
        r"\s+",
        " ",
        skill.strip().lower(),
    )


def extract_skills_from_text(text, skill_list):
    """Find recognized skills in a block of text."""

    text = (text or "").lower()
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


def extract_keywords(text):
    """Extract meaningful words for keyword comparison."""

    words = re.findall(
        r"[a-zA-Z][a-zA-Z0-9+#.-]*",
        (text or "").lower(),
    )

    return {
        word.strip(".-")
        for word in words
        if len(word.strip(".-")) > 2
        and word.strip(".-") not in STOP_WORDS
    }


def calculate_percentage(matched, total):
    """Calculate a percentage safely."""

    if not total:
        return None

    return round(
        len(matched) / len(total) * 100,
        2,
    )


def calculate_experience_years(experiences):
    """Calculate total recorded work experience in years."""

    if not experiences:
        return 0

    periods = []

    for experience in experiences:
        start_date = experience.start_date

        end_date = (
            date.today()
            if experience.currently_working
            else experience.end_date
        )

        if not start_date or not end_date:
            continue

        if end_date < start_date:
            continue

        periods.append(
            (start_date, end_date)
        )

    if not periods:
        return 0

    periods.sort(key=lambda period: period[0])

    merged_periods = []

    for start, end in periods:
        if not merged_periods or start > merged_periods[-1][1]:
            merged_periods.append([start, end])

        elif end > merged_periods[-1][1]:
            merged_periods[-1][1] = end

    total_days = sum(
        (end - start).days
        for start, end in merged_periods
    )

    return round(total_days / 365.25, 2)


def calculate_experience_relevance(job, experiences):
    """Compare recorded work experience with the job title."""

    if not experiences:
        return None

    job_keywords = extract_keywords(job.title)

    if not job_keywords:
        return None

    experience_text = " ".join(
        f"{item.job_title} {item.description}"
        for item in experiences
    )

    experience_keywords = extract_keywords(
        experience_text
    )

    matched = job_keywords.intersection(
        experience_keywords
    )

    return round(
        len(matched) / len(job_keywords) * 100,
        2,
    )


def extract_education_requirements(job):
    """
    Extract education-related keywords from job information.

    General job-description keywords are not treated as
    education requirements.
    """

    job_text = (
        f"{job.title} "
        f"{job.description} "
        f"{job.requirements}"
    )

    sentences = re.split(
        r"[.!?\n;]+",
        job_text,
    )

    required_keywords = set()

    education_triggers = {
        "education",
        "degree",
        "bachelor",
        "bachelors",
        "master",
        "masters",
        "doctorate",
        "phd",
        "diploma",
        "graduate",
        "undergraduate",
        "qualification",
        "qualifications",
        "university",
        "college",
    }

    for sentence in sentences:
        sentence_keywords = extract_keywords(sentence)

        if sentence_keywords.intersection(education_triggers):
            required_keywords.update(
                sentence_keywords.intersection(
                    EDUCATION_KEYWORDS
                )
            )

    return required_keywords


def calculate_education_relevance(job, educations):
    """
    Compare candidate education with explicit job education criteria.

    Returns None when the job does not provide identifiable
    education requirements or candidate education is unavailable.
    """

    if not educations:
        return None

    required_education = extract_education_requirements(job)

    if not required_education:
        return None

    education_text = " ".join(
        f"{item.degree} {item.field_of_study}"
        for item in educations
    )

    candidate_education_keywords = extract_keywords(
        education_text
    )

    if not candidate_education_keywords:
        return None

    matched = required_education.intersection(
        candidate_education_keywords
    )

    return round(
        len(matched) / len(required_education) * 100,
        2,
    )


def evaluate_resume(resume_text, job, candidate_profile=None):
    """
    Evaluate a resume against a job using multiple categories.

    The overall score uses these weights:

    Technical skills: 50
    Keyword matching: 20
    Work experience: 20
    Education: 10

    Categories without sufficient candidate or job information
    are excluded from the weighted calculation.
    """

    resume_text = resume_text or ""

    job_text = (
        f"{job.title} "
        f"{job.description} "
        f"{job.requirements}"
    )

    # Retrieve existing candidate information.

    experiences = []
    educations = []
    profile_skills = []

    profile_skills_text = ""
    professional_summary = ""

    if candidate_profile is not None:
        experiences = list(
            candidate_profile.work_experiences.all()
        )

        educations = list(
            candidate_profile.educations.all()
        )

        profile_skills = list(
            candidate_profile.candidate_skills.all()
        )

        profile_skills_text = (
            candidate_profile.skills or ""
        )

        professional_summary = (
            candidate_profile.professional_summary or ""
        )

    # Include skills from the resume, profile text and
    # structured candidate skill records.

    skill_text = (
        resume_text
        + " "
        + profile_skills_text
        + " "
        + professional_summary
    )

    skill_text += " " + " ".join(
        skill.name
        for skill in profile_skills
    )

    resume_skills = extract_skills_from_text(
        skill_text,
        KNOWN_SKILLS,
    )

    required_skills = extract_skills_from_text(
        job_text,
        KNOWN_SKILLS,
    )

    matched_skills = [
        skill
        for skill in required_skills
        if skill in resume_skills
    ]

    missing_skills = [
        skill
        for skill in required_skills
        if skill not in resume_skills
    ]

    skill_score = calculate_percentage(
        matched_skills,
        required_skills,
    )

    # Record the candidate's declared proficiency.

    proficiency_map = {
        skill.name.lower(): skill.proficiency
        for skill in profile_skills
    }

    proficiency_details = []

    for skill in matched_skills:
        proficiency_details.append({
            "skill": skill,
            "proficiency": proficiency_map.get(
                skill.lower(),
                "NOT_SPECIFIED",
            ),
        })

    # Keyword relevance.

    job_keywords = extract_keywords(job_text)

    resume_keywords = extract_keywords(resume_text)

    matched_keywords = sorted(
        job_keywords.intersection(resume_keywords)
    )

    keyword_score = calculate_percentage(
        matched_keywords,
        job_keywords,
    )

    # Experience relevance.

    experience_score = calculate_experience_relevance(
        job,
        experiences,
    )

    total_experience_years = calculate_experience_years(
        experiences
    )

    # Education relevance.

    education_score = calculate_education_relevance(
        job,
        educations,
    )

    # Calculate the weighted score using only available categories.

    categories = {
        "technical_skills": {
            "weight": 50,
            "score": skill_score,
        },
        "keyword_matching": {
            "weight": 20,
            "score": keyword_score,
        },
        "work_experience": {
            "weight": 20,
            "score": experience_score,
        },
        "education": {
            "weight": 10,
            "score": education_score,
        },
    }

    available_weight = sum(
        category["weight"]
        for category in categories.values()
        if category["score"] is not None
    )

    if available_weight:
        weighted_total = sum(
            category["weight"] * category["score"]
            for category in categories.values()
            if category["score"] is not None
        )

        ats_score = round(
            weighted_total / available_weight,
            2,
        )

    else:
        ats_score = 0

    # Build category-wise score breakdown.

    score_breakdown = {}

    for name, category in categories.items():
        score_breakdown[name] = {
            "weight": category["weight"],
            "score": category["score"],
            "available": category["score"] is not None,
        }

    # Generate strengths and improvement suggestions.

    strengths = []
    suggestions = []

    if matched_skills:
        strengths.append(
            f"Matched {len(matched_skills)} required technical skills."
        )

    if missing_skills:
        suggestions.append(
            "Consider developing these missing skills: "
            + ", ".join(missing_skills)
        )

    if matched_keywords:
        strengths.append(
            f"Matched {len(matched_keywords)} relevant job keywords."
        )

    if keyword_score is not None and keyword_score < 50:
        suggestions.append(
            "Include more relevant terminology from the job description "
            "where it accurately reflects your experience."
        )

    if experience_score is not None and experience_score >= 50:
        strengths.append(
            "Your recorded work experience has relevant job-title "
            "or responsibility keywords."
        )

    if experience_score is not None and experience_score < 50:
        suggestions.append(
            "Highlight relevant responsibilities and achievements "
            "in your work experience."
        )

    if education_score is not None and education_score >= 30:
        strengths.append(
            "Your education contains relevant terms for this position."
        )

    if education_score is not None and education_score < 30:
        suggestions.append(
            "Make your relevant coursework, specialization or "
            "qualifications clearer."
        )

    if not required_skills:
        suggestions.append(
            "The job description contains no recognized technical "
            "skills, so technical skill matching could not be calculated."
        )

    if not experiences:
        suggestions.append(
            "Add work experience to your candidate profile "
            "for a more complete evaluation."
        )

    if not educations:
        suggestions.append(
            "Add education details to your candidate profile "
            "for a more complete evaluation."
        )

    if educations and education_score is None:
        suggestions.append(
            "The job description does not contain clear education "
            "requirements, so education matching was not scored."
        )

    if not strengths:
        strengths.append(
            "The resume was successfully processed. "
            "Add more relevant information to improve matching."
        )

    if not suggestions:
        suggestions.append(
            "Continue keeping your resume and candidate profile "
            "updated with relevant skills and achievements."
        )

    return {
        # Existing response fields: preserve frontend compatibility.

        "ats_score": ats_score,
        "total_required_skills": len(required_skills),
        "matched_count": len(matched_skills),
        "missing_count": len(missing_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "resume_skills": resume_skills,
        "required_skills": required_skills,

        # New evaluation information.

        "score_breakdown": score_breakdown,
        "matched_keywords": matched_keywords,
        "keyword_match_count": len(matched_keywords),
        "total_job_keywords": len(job_keywords),
        "experience_years": total_experience_years,
        "experience_records_count": len(experiences),
        "education_records_count": len(educations),
        "skill_proficiency": proficiency_details,
        "strengths": strengths,
        "improvement_suggestions": suggestions,
        "scoring_method": (
            "Weighted evaluation of technical skills, keywords, "
            "work experience and education. Unavailable categories "
            "are excluded from the weighted calculation."
        ),
    }