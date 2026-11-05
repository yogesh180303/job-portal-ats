from io import BytesIO
from pathlib import Path
import re

from docx import Document
from pypdf import PdfReader


KNOWN_SKILLS = [
    "Python", "Java", "JavaScript", "C", "C++", "C#", "PHP",
    "Django", "React", "Node.js", "HTML", "CSS", "Bootstrap",
    "Spring Boot", "Spring MVC", "Spring Security", "Hibernate",
    "REST APIs", "MySQL", "SQL", "PostgreSQL", "MongoDB", "SQLite",
    "Git", "GitHub", "Docker", "AWS", "Azure", "Linux", "Jenkins",
    "Kubernetes", "Machine Learning", "Data Structures", "Algorithms",
    "OOP", "Jest", "JUnit", "Mockito", "Postman", "Microservices",
    "TypeScript", "Angular", "Vue.js", "Express.js", "FastAPI",
    "Flask", "Redis", "GraphQL", "Next.js", "Tailwind CSS",
]


SECTION_HEADINGS = {
    "education": [
        "education", "educations", "academic background",
        "educational background", "academic qualifications",
    ],
    "experience": [
        "experience", "experiences", "work experience",
        "professional experience", "employment history",
        "work history",
    ],
    "projects": [
        "projects", "personal projects",
        "academic projects", "project experience",
    ],
    "certifications": [
        "certifications", "certificates", "licenses",
        "professional certifications",
    ],
    "summary": [
        "summary", "professional summary", "profile summary",
        "career summary", "objective", "career objective",
        "about me", "profile",
    ],
}


def extract_resume_text(resume_file):
    """Extract readable text from a PDF or DOCX resume."""

    file_extension = Path(resume_file.name).suffix.lower()

    try:
        resume_file.open("rb")
        file_content = resume_file.read()

        if file_extension == ".pdf":
            reader = PdfReader(BytesIO(file_content))

            if reader.is_encrypted:
                raise ValueError(
                    "Password-protected PDFs are not supported."
                )

            extracted_text = "\n".join(
                page.extract_text() or ""
                for page in reader.pages
            )

        elif file_extension == ".docx":
            document = Document(BytesIO(file_content))
            extracted_text = "\n".join(
                paragraph.text
                for paragraph in document.paragraphs
            )

        else:
            raise ValueError(
                "Only PDF and DOCX files are supported."
            )

        extracted_text = extracted_text.strip()

        if not extracted_text:
            raise ValueError(
                "No readable text found. "
                "The resume may be empty or scanned."
            )

        return extracted_text

    except ValueError:
        raise

    except Exception as error:
        raise ValueError(
            "Unable to read this resume. "
            "Please upload a valid PDF or DOCX file."
        ) from error

    finally:
        resume_file.close()


def normalize_line(line):
    """Clean whitespace from a resume line."""
    return re.sub(r"\s+", " ", line).strip()


def extract_contact_details(text):
    """Extract email addresses and phone numbers."""

    email_matches = re.findall(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
        text,
    )

    indian_phone_matches = re.findall(
        r"(?<!\d)(?:\+91[\s.-]?|91[\s.-]?)?"
        r"[6-9]\d{9}(?!\d)",
        text,
    )

    international_phone_matches = re.findall(
        r"(?<!\d)\+\d{1,3}[\s.-]?"
        r"(?:\d[\s.-]?){7,12}\d(?!\d)",
        text,
    )

    phone = ""

    if indian_phone_matches:
        phone = re.sub(
            r"[\s.-]",
            "",
            indian_phone_matches[0],
        )

        if phone.startswith("91") and not phone.startswith("+91"):
            phone = "+" + phone

        if len(phone) == 10:
            phone = "+91" + phone

    elif international_phone_matches:
        phone = re.sub(
            r"[\s.-]",
            "",
            international_phone_matches[0],
        )

    return {
        "email": email_matches[0] if email_matches else "",
        "phone": phone,
    }


def extract_candidate_name(text):
    """Identify a likely candidate name near the beginning."""

    lines = [
        normalize_line(line)
        for line in text.splitlines()
        if normalize_line(line)
    ]

    ignored_words = {
        "resume", "curriculum vitae", "cv",
        "profile", "contact", "summary", "objective",
    }

    for line in lines[:8]:
        cleaned = re.sub(
            r"[^A-Za-z .'-]",
            "",
            line,
        ).strip()

        if cleaned.lower() in ignored_words:
            continue

        if "@" in line or re.search(r"\d", line):
            continue

        words = cleaned.split()

        # Correct common PDF spacing such as "Y OGESH".
        if (
            len(words) >= 2
            and len(words[0]) == 1
            and words[0].isalpha()
            and words[1].isalpha()
        ):
            words[0] += words[1]
            words.pop(1)

            cleaned = " ".join(words)

        words = cleaned.split()

        if 2 <= len(words) <= 5 and len(cleaned) <= 70:
            return cleaned.title()

    return ""


def extract_skills(text):
    """Identify known technical skills in resume text."""

    found_skills = []
    normalized_text = text.lower()

    for skill in KNOWN_SKILLS:
        pattern = (
            r"(?<![a-z0-9+#.])"
            + re.escape(skill.lower())
            + r"(?![a-z0-9+#.])"
        )

        if re.search(pattern, normalized_text):
            found_skills.append(skill)

    return found_skills


def identify_section_heading(line):
    """Identify whether a line represents a resume section."""

    normalized = re.sub(
        r"[:\s]+$",
        "",
        line.lower(),
    ).strip()

    for section, headings in SECTION_HEADINGS.items():
        if normalized in headings:
            return section

    return None


def extract_resume_sections(text):
    """Extract text grouped under common resume sections."""

    sections = {
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "summary": [],
    }

    current_section = None

    for raw_line in text.splitlines():
        line = normalize_line(raw_line)

        if not line:
            continue

        detected_section = identify_section_heading(line)

        if detected_section:
            current_section = detected_section
            continue

        normalized_line = line.lower().strip(" :")

        if normalized_line in {
            "skills",
            "technical skills",
            "key skills",
            "strengths",
            "achievements",
            "interests",
            "contact",
            "references",
            "languages",
        }:
            current_section = None
            continue

        if current_section:
            sections[current_section].append(line)

    return sections


def extract_location(text):
    """
    Extract a city and country from the contact section.

    Uses the final comma-separated segment before the country
    to avoid including email usernames or unrelated text.
    """

    lines = [
        normalize_line(line)
        for line in text.splitlines()
        if normalize_line(line)
    ]

    supported_countries = {
        "india",
        "usa",
        "uk",
        "united kingdom",
        "canada",
        "australia",
    }

    for line in lines[:12]:
        parts = [part.strip() for part in line.split(",")]

        if len(parts) < 2:
            continue

        country = parts[-1].strip(" .")

        if country.lower() not in supported_countries:
            continue

        city_text = parts[-2]

        # Remove email addresses and phone numbers.
        city_text = re.sub(
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b",
            "",
            city_text,
        )

        city_text = re.sub(
            r"\+?\d[\d\s().-]{7,}\d",
            "",
            city_text,
        )

        city_words = re.findall(
            r"[A-Za-z][A-Za-z'-]*",
            city_text,
        )

        if city_words:
            city = city_words[-1]
            return f"{city.title()}, {country.title()}"

    return ""


def parse_resume(resume_file):
    """
    Extract structured information from a PDF or DOCX resume.

    Does not modify candidate profiles or database records.
    """

    text = extract_resume_text(resume_file)

    contact_details = extract_contact_details(text)
    sections = extract_resume_sections(text)

    return {
        "candidate": {
            "full_name": extract_candidate_name(text),
            "email": contact_details["email"],
            "phone": contact_details["phone"],
            "location": extract_location(text),
        },
        "skills": extract_skills(text),
        "education": sections["education"],
        "experience": sections["experience"],
        "projects": sections["projects"],
        "certifications": sections["certifications"],
        "summary": "\n".join(sections["summary"]),
        "extracted_text": text,
    }