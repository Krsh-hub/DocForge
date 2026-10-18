"""Template Service: Variable Extraction, Schema Inference, and Sandboxed Jinja2 Validation"""
import os
import re
import shutil
from pathlib import Path
from typing import Dict, Any, List, Set, Tuple
from docxtpl import DocxTemplate
from jinja2.sandbox import SandboxedEnvironment
from jinja2 import meta
from fastapi import UploadFile, HTTPException
from app.core.config import settings

# Create Sandboxed Jinja Environment
sandboxed_env = SandboxedEnvironment(
    autoescape=False,
    trim_blocks=True,
    lstrip_blocks=True
)

def get_docx_variables(docx_path: Path) -> List[str]:
    """
    Inspect a docx file using docxtpl and extract all Jinja2 variables.
    """
    try:
        doc = DocxTemplate(docx_path)
        variables: Set[str] = doc.get_undeclared_template_variables(sandboxed_env)
        # Sort variables alphabetically
        return sorted(list(variables))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to inspect docx template: {str(e)}")

def infer_field_schema(variables: List[str]) -> List[Dict[str, Any]]:
    """
    Infer a structured field schema with label, type, required, and section groups.
    """
    fields = []
    
    # Common mappings
    for var in variables:
        key = var
        label = key.replace("_", " ").replace(".", " - ").title()
        field_type = "text"
        group = "General Information"
        required = True
        default_val = ""

        # Infer group and type based on naming patterns
        lower_var = key.lower()
        if "client" in lower_var:
            group = "Client Details"
            if "name" in lower_var:
                field_type = "client_ref"
            elif "address" in lower_var or "notes" in lower_var:
                field_type = "textarea"
            elif "date" in lower_var:
                field_type = "date"
        elif "date" in lower_var or "period" in lower_var:
            group = "Dates & Validity"
            field_type = "date"
        elif "deliverable" in lower_var or "milestone" in lower_var or "item" in lower_var:
            group = "Project & Scope"
            field_type = "table"
        elif "amount" in lower_var or "rate" in lower_var or "price" in lower_var or "cost" in lower_var or "total" in lower_var:
            group = "Financials"
            field_type = "money"
            default_val = 0.0
        elif "clause" in lower_var:
            group = "Clauses & Terms"
            field_type = "clause_picker"
        elif "include_" in lower_var or "is_" in lower_var or "has_" in lower_var:
            group = "Options & Flags"
            field_type = "boolean"
            default_val = True
            required = False
        elif "jurisdiction" in lower_var or "governing_law" in lower_var:
            group = "Legal & Governance"
            field_type = "text"
            default_val = "Kolkata, West Bengal, India"
        elif "term" in lower_var:
            group = "Legal & Governance"
            field_type = "text"
            default_val = "2 Years"

        fields.append({
            "key": key,
            "label": label,
            "type": field_type,
            "required": required,
            "default": default_val,
            "group": group,
            "help_text": f"Input value for placeholder {{{{{key}}}}}",
            "validation": {}
        })

    return fields

def save_uploaded_template_file(file: UploadFile, template_id: int, version_no: int) -> Path:
    """Save an uploaded docx file under /data/templates/{template_id}_v{version_no}.docx"""
    ext = Path(file.filename or "").suffix.lower()
    if ext != ".docx":
        raise HTTPException(status_code=400, detail="Only .docx template files are supported.")

    dest_filename = f"tpl_{template_id}_v{version_no}.docx"
    dest_path = settings.templates_dir / dest_filename
    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return dest_path
