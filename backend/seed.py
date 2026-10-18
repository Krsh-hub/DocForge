import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from app.core.db import SessionLocal, engine, Base
from app.models.all_models import (
    User, UserRole, CompanySettings, Template, TemplateType,
    TemplateVersion, ClauseBlock, NumberSequence
)
from app.core.security import hash_password

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Company Settings
        company = db.query(CompanySettings).first()
        if not company:
            company = CompanySettings(
                legal_name="AKS Forge by Curawave LLP",
                trade_name="AKS Forge",
                address="Suite 4B, Salt Lake Sector V, Bidhannagar",
                state="West Bengal",
                state_code="19",
                country="India",
                gstin="19AABCA1234F1Z5",
                pan="AABCA1234F",
                email="billing@aksforge.local",
                phone="+91 98765 43210",
                website="https://aksforge.local",
                bank_name="HDFC Bank",
                bank_account_no="50200012345678",
                bank_ifsc="HDFC0000123",
                bank_branch="Salt Lake Sector V Branch",
                bank_account_name="AKS Forge by Curawave LLP",
                upi_id="aksforge@hdfcbank",
                default_currency="INR",
                default_payment_terms_days=15,
                default_tax_rate=18.00,
                invoice_footer="Thank you for your business. Please quote invoice number during wire transfer.",
                theme_accent="#4f46e5"
            )
            db.add(company)
            print("Seeded default company settings.")

        # 2. Number Sequences
        doc_types = ["invoice", "sow", "nda", "msa", "general"]
        fy = "2026-27"
        for dt in doc_types:
            seq = db.query(NumberSequence).filter_by(doc_type=dt, financial_year=fy).first()
            if not seq:
                prefix = f"{dt.upper()}/{{FY}}/{{SEQ:04d}}"
                if dt == "invoice":
                    prefix = "INV/{FY}/{SEQ:04d}"
                seq = NumberSequence(
                    doc_type=dt,
                    financial_year=fy,
                    last_number=0,
                    prefix_format=prefix
                )
                db.add(seq)
        print("Seeded number sequences for FY 2026-27.")

        # 3. Default Clause Blocks for SOW
        sample_clauses = [
            (
                "payment_terms",
                "Standard Milestone Payment Terms",
                "Payment shall be due within 15 calendar days from the invoice date. Late payments beyond 30 days shall accrue interest at 1.5% per month.",
                "sow",
                True
            ),
            (
                "ip_ownership",
                "IP Ownership Upon Full Payment",
                "AKS Forge assigns all intellectual property rights in custom deliverables to Client solely upon full and final receipt of all agreed payments.",
                "sow,msa",
                True
            ),
            (
                "confidentiality",
                "Mutual Confidentiality (3 Years)",
                "Both parties agree to protect and treat all non-public proprietary disclosures with utmost care for a period of 3 (three) years from the effective date.",
                "sow,msa,nda",
                True
            ),
            (
                "revision_limits",
                "Two Rounds of Feedback Included",
                "Each deliverable includes up to two (2) consolidated rounds of feedback and minor revisions. Additional rounds will be billed at standard hourly rates.",
                "sow",
                True
            ),
            (
                "warranty",
                "30-Day Bug Fix Warranty",
                "AKS Forge provides a 30-day warranty following final acceptance to resolve critical software bugs discovered under normal agreed operating conditions.",
                "sow",
                True
            ),
            (
                "termination",
                "Convenience Termination (14 Days)",
                "Either party may terminate this agreement with 14 calendar days written notice. Client will compensate for all milestones and hours accrued up to termination.",
                "sow,msa",
                True
            )
        ]

        for cat, title, body, applies, is_def in sample_clauses:
            clause = db.query(ClauseBlock).filter_by(title=title).first()
            if not clause:
                clause = ClauseBlock(
                    category=cat,
                    title=title,
                    body=body,
                    applies_to=applies,
                    is_default=is_def
                )
                db.add(clause)
        # 4. Seed Default Templates (Mutual NDA, One-Way NDA, SOW)
        from app.services.template_service import get_docx_variables, infer_field_schema
        import shutil

        templates_data = [
            {
                "name": "Standard Mutual NDA",
                "type": "nda",
                "desc": "Standard bilateral non-disclosure agreement for tech and marketing client discussions.",
                "file": "mutual_nda.docx"
            },
            {
                "name": "One-Way NDA (Unilateral)",
                "type": "nda",
                "desc": "Unilateral non-disclosure agreement protecting AKS Forge proprietary IP disclosures.",
                "file": "one_way_nda.docx"
            },
            {
                "name": "Statement of Work (SOW)",
                "type": "sow",
                "desc": "Standard Statement of Work with milestone schedules, deliverables, and standard clause blocks.",
                "file": "statement_of_work.docx"
            }
        ]

        from app.core.config import settings
        seed_files_dir = Path(__file__).parent / "app" / "templates_seed"

        for td in templates_data:
            existing_t = db.query(Template).filter_by(name=td["name"]).first()
            if not existing_t:
                tpl = Template(
                    name=td["name"],
                    type=td["type"],
                    description=td["desc"],
                    is_active=True
                )
                db.add(tpl)
                db.flush()

                src_file = seed_files_dir / td["file"]
                if src_file.is_file():
                    target_filename = f"tpl_{tpl.id}_v1.docx"
                    dest_file = settings.templates_dir / target_filename
                    shutil.copy2(src_file, dest_file)

                    vars_found = get_docx_variables(dest_file)
                    schema = infer_field_schema(vars_found)

                    ver = TemplateVersion(
                        template_id=tpl.id,
                        version_no=1,
                        file_path=f"/templates/{target_filename}",
                        field_schema=schema,
                        locked_at=None
                    )
                    db.add(ver)
        print("Seeded default document templates.")

        # 5. Seed Demo Client & Project
        from app.models.all_models import Client, Contact, Project
        demo_client = db.query(Client).first()
        if not demo_client:
            client = Client(
                legal_name="Apex Global Technologies Pvt Ltd",
                display_name="Apex Tech",
                address="Plot 42, Electronics City Phase 1",
                state="Karnataka",
                state_code="29",
                country="India",
                gstin="29ABCDE1234F1Z5",
                pan="ABCDE1234F",
                billing_email="accounts@apextech.in",
                signatory_name="Vikramaditya Roy",
                signatory_designation="Managing Director",
                notes="Enterprise SaaS client with bi-weekly sprint deliverables."
            )
            db.add(client)
            db.flush()

            contact = Contact(
                client_id=client.id,
                name="Siddharth Menon",
                email="siddharth.m@apextech.in",
                phone="+91 98200 12345",
                role="VP Engineering"
            )
            db.add(contact)

            project = Project(
                client_id=client.id,
                name="Cloud Analytics Dashboard & ETL Pipeline",
                service_type="tech",
                description="End-to-end fullstack platform build with automated data transformation.",
                status="active"
            )
            db.add(project)
            print("Seeded demo client and active project.")

        db.commit()
        print("Database seed completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
