
from io import BytesIO
from pathlib import Path

from docx import Document
from pypdf import PdfReader


def extract_resume_text(resume_file):
    """
    Extract readable text from an uploaded PDF or DOCX resume.

    Args:
        resume_file: Django Resume.file FieldFile.

    Returns:
        Extracted text as a string.

    Raises:
        ValueError: If the file format is unsupported or text
                    cannot be extracted.
    """

    file_extension = Path(resume_file.name).suffix.lower()

    try:
        resume_file.open("rb")
        file_content = resume_file.read()

        if file_extension == ".pdf":
            reader = PdfReader(BytesIO(file_content))

            if reader.is_encrypted:
                raise ValueError("Password-protected PDFs are not supported.")

            extracted_text = "\n".join(
                page.extract_text() or ""
                for page in reader.pages
            )

        elif file_extension == ".docx":
            document = Document(BytesIO(file_content))

            paragraphs = [
                paragraph.text
                for paragraph in document.paragraphs
            ]

            extracted_text = "\n".join(paragraphs)

        else:
            raise ValueError("Only PDF and DOCX files are supported.")

        extracted_text = extracted_text.strip()

        if not extracted_text:
            raise ValueError(
                "No readable text found. The resume may be empty or scanned."
            )

        return extracted_text

    except ValueError:
        raise

    except Exception as error:
        raise ValueError(
            "Unable to read this resume. Please upload a valid PDF or DOCX file."
        ) from error

    finally:
        resume_file.close()
