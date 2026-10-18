"""Numbering Service: Atomic Document Sequence Allocation in Financial Year Format"""
from datetime import datetime, date, timezone
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.all_models import NumberSequence


def get_current_financial_year(target_date: Optional[date] = None) -> str:
    """
    Returns Indian financial year string (e.g. '2026-27' for April 2026 - March 2027)
    """
    if target_date is None:
        target_date = date.today()

    year = target_date.year
    month = target_date.month

    # In India, FY starts in April (month 4)
    if month >= 4:
        start_year = year
        end_year = (year + 1) % 100
    else:
        start_year = year - 1
        end_year = year % 100

    return f"{start_year}-{end_year:02d}"


def allocate_document_number(
    db: Session,
    doc_type: str,
    target_date: Optional[date] = None
) -> str:
    """
    Atomically generates next document sequence number inside a database transaction.
    No gaps or duplicates.
    Example: SOW/2026-27/0001, INV/2026-27/0042
    """
    fy = get_current_financial_year(target_date)
    dt = doc_type.lower().strip()

    # Query sequence with row-level lock behavior
    seq = (
        db.query(NumberSequence)
        .filter(NumberSequence.doc_type == dt, NumberSequence.financial_year == fy)
        .with_for_update()
        .first()
    )

    if not seq:
        # Default prefix format
        prefix = f"{dt.upper()}/{{FY}}/{{SEQ:04d}}"
        if dt == "invoice":
            prefix = "INV/{FY}/{SEQ:04d}"

        seq = NumberSequence(
            doc_type=dt,
            financial_year=fy,
            last_number=1,
            prefix_format=prefix
        )
        db.add(seq)
        current_num = 1
    else:
        seq.last_number += 1
        current_num = seq.last_number

    # Commit/flush happens in calling transaction
    formatted_number = seq.prefix_format.format(
        TYPE=dt.upper(),
        FY=fy,
        SEQ=current_num
    )
    return formatted_number
