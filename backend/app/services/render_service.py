"""Document Render Service: Sandboxed Jinja docxtpl rendering and LibreOffice headless PDF conversion"""
import os
import shutil
import hashlib
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional
from docxtpl import DocxTemplate
from fastapi import HTTPException
from app.core.config import settings
from app.services.template_service import sandboxed_env


def calculate_file_hash(file_path: Path) -> str:
    """Calculate SHA-256 hash of a file for integrity verification"""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()


def render_docx(template_path: Path, context: Dict[str, Any], output_path: Path) -> Path:
    """
    Render a DOCX template using docxtpl with Jinja2 SandboxedEnvironment.
    """
    if not template_path.is_file():
        raise HTTPException(status_code=404, detail="Template file not found.")

    try:
        doc = DocxTemplate(template_path)
        # Render with sandboxed environment
        doc.render(context, sandboxed_env)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.save(str(output_path))
        return output_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to render document: {str(e)}")


def convert_docx_to_pdf(docx_path: Path, output_dir: Optional[Path] = None) -> Optional[Path]:
    """
    Convert DOCX to PDF using LibreOffice headless command.
    Returns the path to generated PDF if successful, else None.
    """
    if not docx_path.is_file():
        return None

    if output_dir is None:
        output_dir = docx_path.parent

    # Find soffice binary
    soffice_cmd = None
    if settings.LIBREOFFICE_PATH and Path(settings.LIBREOFFICE_PATH).is_file():
        soffice_cmd = settings.LIBREOFFICE_PATH
    else:
        which_path = shutil.which("soffice")
        if which_path:
            soffice_cmd = which_path
        else:
            win_paths = [
                r"C:\Program Files\LibreOffice\program\soffice.exe",
                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
            ]
            for wp in win_paths:
                if Path(wp).is_file():
                    soffice_cmd = wp
                    break

    if not soffice_cmd:
        # LibreOffice not available
        return None

    try:
        cmd = [
            soffice_cmd,
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            str(output_dir),
            str(docx_path),
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        expected_pdf = output_dir / f"{docx_path.stem}.pdf"
        if expected_pdf.is_file():
            return expected_pdf
        return None
    except Exception as e:
        print(f"LibreOffice conversion failed: {e}")
        return None
