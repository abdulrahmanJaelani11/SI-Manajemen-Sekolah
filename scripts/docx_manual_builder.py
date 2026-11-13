import os
import zipfile
import io
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION_START
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

# --- Color Constants ---
COLOR_NAVY = RGBColor(30, 58, 138)       # #1E3A8A - Primary Header
COLOR_SLATE_DARK = RGBColor(15, 23, 42)  # #0F172A - Subheadings
COLOR_BODY = RGBColor(51, 65, 85)        # #334155 - Body Text
COLOR_MUTED = RGBColor(100, 116, 139)    # #64748B - Muted/Footers
COLOR_BLUE = RGBColor(37, 99, 235)       # #2563EB - Highlights

HEX_NAVY = "1E3A8A"
HEX_SLATE_DARK = "0F172A"
HEX_ZEBRA = "F8FAFC"
HEX_BORDER = "CBD5E1"                    # Light Gray #CBD5E1 (Slate 300) - Konsisten untuk seluruh border tabel
HEX_WHITE = "FFFFFF"

TEMPLATE_COVER_PATH = os.path.join("docs", "user-manual", "Cover Template Buku Manual Sistem.docx")

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    """Set inner cell padding in dxa (1 pt = 20 dxa)"""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def set_cell_shading(cell, color_hex):
    """Set background color of a table cell"""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    tcPr.append(shd)

def set_table_borders(tbl, color="CBD5E1", sz="4"):
    """Set uniform table-level borders (top, left, bottom, right, insideH, insideV)"""
    tblPr = tbl._tbl.tblPr
    borders = parse_xml(f'''
        <w:tblBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:left w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideH w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
            <w:insideV w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>
        </w:tblBorders>
    ''')
    tblPr.append(borders)

def set_cell_borders(cell, top="none", bottom="none", left="none", right="none", 
                     border_color="CBD5E1", left_color=None, left_sz=None, sz="4"):
    """Set custom borders for callout box or table cell with consistent border color"""
    tcPr = cell._tc.get_or_add_tcPr()
    eff_left_color = left_color if left_color is not None else border_color
    eff_left_sz = left_sz if left_sz is not None else sz
    
    left_xml = f'<w:left w:val="single" w:sz="{eff_left_sz}" w:space="0" w:color="{eff_left_color}"/>' if left != "none" else '<w:left w:val="none"/>'
    top_xml = f'<w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>' if top != "none" else '<w:top w:val="none"/>'
    bottom_xml = f'<w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>' if bottom != "none" else '<w:bottom w:val="none"/>'
    right_xml = f'<w:right w:val="single" w:sz="{sz}" w:space="0" w:color="{border_color}"/>' if right != "none" else '<w:right w:val="none"/>'
    
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            {top_xml}
            {left_xml}
            {bottom_xml}
            {right_xml}
        </w:tcBorders>
    ''')
    tcPr.append(borders)

def add_field_code(run, field_text):
    """Add dynamic Word field code like PAGE or NUMPAGES"""
    fldChar1 = parse_xml(r'<w:fldChar %s w:fldCharType="begin"/>' % nsdecls('w'))
    instrText = parse_xml(r'<w:instrText %s xml:space="preserve"> %s </w:instrText>' % (nsdecls('w'), field_text))
    fldChar2 = parse_xml(r'<w:fldChar %s w:fldCharType="separate"/>' % nsdecls('w'))
    fldChar3 = parse_xml(r'<w:fldChar %s w:fldCharType="end"/>' % nsdecls('w'))
    run._r.append(fldChar1)
    run._r.append(instrText)
    run._r.append(fldChar2)
    run._r.append(fldChar3)

def create_base_document(book_series_title, book_subtitle, doc_id, target_roles, version="1.0"):
    """
    Initialize document using the official User's Canva Cover Template.
    - Menghilangkan teks judul duplikat "Sistem Manajemen Sekolah Terpadu" pada body cover karena sudah tertera pada gambar banner.
    - Mengosongkan placeholder Logo, Nama Sekolah, dan Versi/Tahun untuk diisi manual pihak sekolah.
    - Menerapkan border tabel seragam abu-abu #CBD5E1 pada seluruh sisi (termasuk sisi kiri).
    """
    if not os.path.exists(TEMPLATE_COVER_PATH):
        raise FileNotFoundError(f"Template cover tidak ditemukan di: {TEMPLATE_COVER_PATH}")
        
    with open(TEMPLATE_COVER_PATH, 'rb') as f:
        zip_bytes = f.read()

    # Fix Canva 'w:val="start"' into 'w:val="left"' for 100% Word & python-docx compatibility
    with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as z:
        doc_xml = z.read('word/document.xml').decode('utf-8')

    doc_xml_fixed = doc_xml.replace('w:val="start"', 'w:val="left"')

    out_zip_buffer = io.BytesIO()
    with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as z_in:
        with zipfile.ZipFile(out_zip_buffer, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
            for item in z_in.infolist():
                if item.filename == 'word/document.xml':
                    z_out.writestr(item, doc_xml_fixed.encode('utf-8'))
                else:
                    z_out.writestr(item, z_in.read(item.filename))

    out_zip_buffer.seek(0)
    doc = docx.Document(out_zip_buffer)

    # ==================== APPLY COVER DETAILS (SECTION 0) ====================
    # 1. Hapus paragraf teks judul "Sistem Manajemen Sekolah Terpadu" karena sudah ada pada grafis banner
    for p in list(doc.paragraphs):
        if "Sistem Manajemen Sekolah Terpadu" in p.text:
            p_elem = p._element
            p_elem.getparent().remove(p_elem)
            break

    # 2. Perbarui subjudul "Manual Book" dengan nama seri buku panduan
    for p in doc.paragraphs:
        if "Manual Book" in p.text:
            p.text = ""
            r_mb = p.add_run("Manual Book\n")
            r_mb.font.name = "Canva Sans Bold"
            r_mb.font.size = Pt(22)
            r_mb.font.bold = True
            r_mb.font.color.rgb = COLOR_NAVY
            
            r_bk = p.add_run(book_series_title)
            r_bk.font.name = "Canva Sans Bold"
            r_bk.font.size = Pt(14)
            r_bk.font.bold = True
            r_bk.font.color.rgb = COLOR_SLATE_DARK
            break

    # 3. Kosongkan placeholder Logo, Nama Sekolah, dan Versi/Tahun sesuai instruksi pengguna
    for p in doc.paragraphs:
        if "[Area Logo]" in p.text or "[Nama Sekolah/Instansi]" in p.text:
            p.text = "\n"
        elif "[Versi / Tahun]" in p.text:
            p.text = ""

    # ==================== SECTION 1: BODY OF MANUAL ====================
    body_sec = doc.add_section(WD_SECTION_START.NEW_PAGE)
    body_sec.header.is_linked_to_previous = False
    body_sec.footer.is_linked_to_previous = False

    # Standar Halaman A4 & Margin
    body_sec.page_width = Inches(8.27)    # 210 mm
    body_sec.page_height = Inches(11.69)  # 297 mm
    body_sec.top_margin = Inches(0.984)   # 2.5 cm
    body_sec.bottom_margin = Inches(0.984)# 2.5 cm
    body_sec.left_margin = Inches(1.181)  # 3.0 cm (margin jilid)
    body_sec.right_margin = Inches(0.984) # 2.5 cm

    # Setup Running Header
    header = body_sec.header
    header_p = header.paragraphs[0]
    header_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    hrun1 = header_p.add_run("Sistem Informasi Manajemen Sekolah Terpadu  |  ")
    hrun1.font.name = "Segoe UI"
    hrun1.font.size = Pt(8.5)
    hrun1.font.color.rgb = COLOR_MUTED
    hrun2 = header_p.add_run(book_series_title)
    hrun2.font.name = "Segoe UI"
    hrun2.font.size = Pt(8.5)
    hrun2.font.bold = True
    hrun2.font.color.rgb = COLOR_NAVY

    # Setup Running Footer
    footer = body_sec.footer
    footer_p = footer.paragraphs[0]
    footer_p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    frun1 = footer_p.add_run("Dokumen Resmi - Hak Cipta © 2026 Lingkungan Sekolah                                                  Halaman ")
    frun1.font.name = "Segoe UI"
    frun1.font.size = Pt(8.5)
    frun1.font.color.rgb = COLOR_MUTED

    frun_page = footer_p.add_run()
    frun_page.font.name = "Segoe UI"
    frun_page.font.size = Pt(8.5)
    frun_page.font.bold = True
    frun_page.font.color.rgb = COLOR_NAVY
    add_field_code(frun_page, "PAGE")

    frun2 = footer_p.add_run(" dari ")
    frun2.font.name = "Segoe UI"
    frun2.font.size = Pt(8.5)
    frun2.font.color.rgb = COLOR_MUTED

    frun_numpages = footer_p.add_run()
    frun_numpages.font.name = "Segoe UI"
    frun_numpages.font.size = Pt(8.5)
    frun_numpages.font.bold = True
    frun_numpages.font.color.rgb = COLOR_NAVY
    add_field_code(frun_numpages, "NUMPAGES")

    # ==================== LEMBAR KONTROL DOKUMEN (HALAMAN 2) ====================
    p_meta_title = doc.add_paragraph()
    p_meta_title.paragraph_format.space_before = Pt(6)
    p_meta_title.paragraph_format.space_after = Pt(4)
    r_mt = p_meta_title.add_run("LEMBAR KONTROL & PENGESAHAN DOKUMEN")
    r_mt.font.name = "Segoe UI"
    r_mt.font.size = Pt(13)
    r_mt.font.bold = True
    r_mt.font.color.rgb = COLOR_NAVY

    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    # Set uniform gray borders on table level
    set_table_borders(meta_table, color=HEX_BORDER, sz="4")

    col_widths = [Inches(1.8), Inches(4.3)]
    for row in meta_table.rows:
        for idx, width in enumerate(col_widths):
            row.cells[idx].width = width

    meta_data = [
        ("Nomor Dokumen", doc_id),
        ("Judul Seri Panduan", book_series_title),
        ("Deskripsi Dokumen", book_subtitle),
        ("Sasaran Pengguna", target_roles),
        ("Versi Sistem / Rilis", f"Versi {version} - Rilis Stabil Resmi"),
        ("Status Dokumen", "Dokumen Terverifikasi untuk Implementasi Resmi Sekolah"),
    ]

    for idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]

        if idx % 2 == 0:
            set_cell_shading(c0, "F1F5F9")
            set_cell_shading(c1, "F8FAFC")
        else:
            set_cell_shading(c0, "FFFFFF")
            set_cell_shading(c1, "FFFFFF")

        set_cell_margins(c0, top=90, bottom=90, left=130, right=130)
        set_cell_margins(c1, top=90, bottom=90, left=130, right=130)
        set_cell_borders(c0, top="single", bottom="single", left="single", right="single", border_color=HEX_BORDER)
        set_cell_borders(c1, top="single", bottom="single", left="single", right="single", border_color=HEX_BORDER)

        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(0)
        r0 = p0.add_run(label)
        r0.font.name = "Segoe UI"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_NAVY

        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(val)
        r1.font.name = "Segoe UI"
        r1.font.size = Pt(9)
        r1.font.color.rgb = COLOR_BODY

    # Space after metadata table
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(6)
    sp.paragraph_format.space_after = Pt(6)

    return doc

def add_heading_1(doc, text, page_break=True):
    """Add Chapter / Level 1 Heading (e.g. BAB 1: ...) always on a fresh new page"""
    if page_break:
        doc.add_page_break()
        
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = "Segoe UI"
    run.font.size = Pt(15.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_NAVY
    
    # Add subtle accent rule under Heading 1
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.LEFT
    t.rows[0].height = Pt(2)
    c = t.cell(0, 0)
    c.width = Inches(6.1)
    set_cell_shading(c, "3B82F6")
    set_cell_borders(c, top="none", bottom="none", left="none", right="none")
    
    # Spacer
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(4)
    sp.paragraph_format.space_after = Pt(6)
    return p

def add_heading_2(doc, text):
    """Add Section / Level 2 Heading (e.g. 1.1 ...)"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = "Segoe UI"
    run.font.size = Pt(12.5)
    run.font.bold = True
    run.font.color.rgb = COLOR_SLATE_DARK
    return p

def add_heading_3(doc, text):
    """Add Sub-section / Level 3 Heading"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    
    run = p.add_run(text)
    run.font.name = "Segoe UI"
    run.font.size = Pt(11)
    run.font.bold = True
    run.font.color.rgb = COLOR_BLUE
    return p

def add_paragraph(doc, text, bold_prefix=None, italic=False, space_after=6):
    """Add formatted body paragraph"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Segoe UI"
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_SLATE_DARK
        
    run = p.add_run(text)
    run.font.name = "Segoe UI"
    run.font.size = Pt(10.5)
    run.font.italic = italic
    run.font.color.rgb = COLOR_BODY
    return p

def add_bullet(doc, text, bold_prefix=None):
    """Add a clean bullet item with bold prefix and custom bullet symbol"""
    p = doc.add_paragraph()
    p.paragraph_format.left_indent = Inches(0.25)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    r_sym = p.add_run("•  ")
    r_sym.font.name = "Segoe UI"
    r_sym.font.size = Pt(10)
    r_sym.font.bold = True
    r_sym.font.color.rgb = COLOR_BLUE
    
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = "Segoe UI"
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = COLOR_SLATE_DARK
        
    run = p.add_run(text)
    run.font.name = "Segoe UI"
    run.font.size = Pt(10)
    run.font.color.rgb = COLOR_BODY
    return p

def add_step(doc, step_num, title, description, details=None):
    """Add a structured sequential step"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    
    r_badge = p.add_run(f"Langkah {step_num}: ")
    r_badge.font.name = "Segoe UI"
    r_badge.font.size = Pt(10.5)
    r_badge.font.bold = True
    r_badge.font.color.rgb = COLOR_BLUE
    
    r_title = p.add_run(title)
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(10.5)
    r_title.font.bold = True
    r_title.font.color.rgb = COLOR_SLATE_DARK
    
    p_desc = doc.add_paragraph()
    p_desc.paragraph_format.left_indent = Inches(0.25)
    p_desc.paragraph_format.space_after = Pt(4)
    p_desc.paragraph_format.line_spacing = 1.15
    r_desc = p_desc.add_run(description)
    r_desc.font.name = "Segoe UI"
    r_desc.font.size = Pt(10)
    r_desc.font.color.rgb = COLOR_BODY
    
    if details:
        for d in details:
            pd = doc.add_paragraph()
            pd.paragraph_format.left_indent = Inches(0.4)
            pd.paragraph_format.space_after = Pt(2)
            pd.paragraph_format.line_spacing = 1.15
            r_dash = pd.add_run("–  ")
            r_dash.font.name = "Segoe UI"
            r_dash.font.size = Pt(9.5)
            r_dash.font.bold = True
            r_dash.font.color.rgb = COLOR_MUTED
            rd = pd.add_run(d)
            rd.font.name = "Segoe UI"
            rd.font.size = Pt(9.5)
            rd.font.color.rgb = COLOR_BODY

def add_callout(doc, callout_type, title, text):
    """Add visual callout box (NOTE, TIP, WARNING, IMPORTANT)"""
    config = {
        "NOTE": {
            "bg": "EFF6FF",       # Blue 50
            "border": "2563EB",   # Blue 600
            "title_color": RGBColor(30, 64, 175), # Blue 800
            "icon": "📘 INFORMASI PENTING"
        },
        "TIP": {
            "bg": "F0FDF4",       # Green 50
            "border": "16A34A",   # Green 600
            "title_color": RGBColor(22, 101, 52), # Green 800
            "icon": "💡 PETUNJUK & TIPS"
        },
        "WARNING": {
            "bg": "FFFBEB",       # Amber 50
            "border": "D97706",   # Amber 600
            "title_color": RGBColor(154, 52, 18), # Amber 800
            "icon": "⚠️ PERHATIAN & PERINGATAN"
        },
        "IMPORTANT": {
            "bg": "FEF2F2",       # Red 50
            "border": "DC2626",   # Red 600
            "title_color": RGBColor(153, 27, 27), # Red 800
            "icon": "🛑 WAJIB DIPERHATIKAN"
        }
    }
    
    cfg = config.get(callout_type.upper(), config["NOTE"])
    
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    cell = tbl.cell(0, 0)
    cell.width = Inches(6.1)
    set_cell_shading(cell, cfg["bg"])
    set_cell_margins(cell, top=120, bottom=120, left=180, right=160)
    set_cell_borders(cell, left="single", left_color=cfg["border"], left_sz="24")
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    
    r_icon = p.add_run(f"{cfg['icon']}: {title}\n")
    r_icon.font.name = "Segoe UI"
    r_icon.font.size = Pt(10)
    r_icon.font.bold = True
    r_icon.font.color.rgb = cfg["title_color"]
    
    r_txt = p.add_run(text)
    r_txt.font.name = "Segoe UI"
    r_txt.font.size = Pt(9.5)
    r_txt.font.color.rgb = COLOR_BODY
    
    # Spacing after callout table
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(4)
    sp.paragraph_format.space_after = Pt(4)

def add_styled_table(doc, headers, rows, col_widths=None):
    """
    Add a professional enterprise table with Navy header and zebra striping.
    Konsistensi border: Seluruh sisi tabel (top, bottom, left, right, inner) menggunakan warna abu-abu #CBD5E1 yang seragam.
    """
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    # Set uniform gray border on table level
    set_table_borders(tbl, color=HEX_BORDER, sz="4")
    
    # Header Row
    header_row = tbl.rows[0]
    for idx, heading in enumerate(headers):
        cell = header_row.cells[idx]
        if col_widths and idx < len(col_widths):
            cell.width = col_widths[idx]
        set_cell_shading(cell, HEX_NAVY)
        set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
        set_cell_borders(cell, top="single", bottom="single", left="single", right="single", border_color=HEX_BORDER)
        
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(heading)
        r.font.name = "Segoe UI"
        r.font.size = Pt(9.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)
        
    # Data Rows
    for row_idx, row_data in enumerate(rows):
        row = tbl.rows[row_idx + 1]
        bg_color = HEX_ZEBRA if row_idx % 2 == 1 else HEX_WHITE
        
        for col_idx, val in enumerate(row_data):
            cell = row.cells[col_idx]
            if col_widths and col_idx < len(col_widths):
                cell.width = col_widths[col_idx]
            set_cell_shading(cell, bg_color)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            set_cell_borders(cell, top="single", bottom="single", left="single", right="single", border_color=HEX_BORDER)
            
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            r = p.add_run(str(val))
            r.font.name = "Segoe UI"
            r.font.size = Pt(9)
            r.font.color.rgb = COLOR_BODY
            
    # Spacer
    sp = doc.add_paragraph()
    sp.paragraph_format.space_before = Pt(4)
    sp.paragraph_format.space_after = Pt(6)

def add_menu_path(doc, path_string):
    """Add a breadcrumb navigation path box"""
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    
    r_label = p.add_run("📍 Navigasi Menu: ")
    r_label.font.name = "Segoe UI"
    r_label.font.size = Pt(9.5)
    r_label.font.bold = True
    r_label.font.color.rgb = COLOR_BLUE
    
    r_path = p.add_run(path_string)
    r_path.font.name = "Segoe UI"
    r_path.font.size = Pt(9.5)
    r_path.font.bold = True
    r_path.font.color.rgb = COLOR_SLATE_DARK
