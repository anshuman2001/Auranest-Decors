#!/usr/bin/env python3
"""Build a premium AuraNest Decors catalogue PDF from live Firestore products.
Run from repo root. Needs network to m.media-amazon.com + res.cloudinary.com,
and Playwright (pre-installed). Furniture images are taken from local assets/products/.
Output: catalog_pdf_build/AuraNest-Catalogue.pdf
"""
import json, os, shutil, urllib.request, html, subprocess, sys

OUT = "catalog_pdf_build"
IMG = f"{OUT}/img"
os.makedirs(IMG, exist_ok=True)
PROJ = "auranest-decors"
FS = f"https://firestore.googleapis.com/v1/projects/{PROJ}/databases/(default)/documents/products?pageSize=400"

def gv(f, k, d=""):
    v = f.get(k, {})
    return v.get("stringValue") or v.get("integerValue") or d

# 1. fetch products
docs = json.loads(urllib.request.urlopen(FS, timeout=60).read()).get("documents", [])
prods = []
for x in docs:
    f = x["fields"]
    if f.get("hideFromCatalog", {}).get("booleanValue", False):
        continue
    name = gv(f, "name")
    if not name:
        continue
    imgs = f.get("images", {}).get("arrayValue", {}).get("values", [])
    prods.append({
        "name": name, "price": gv(f, "price"), "mrp": gv(f, "mrp"),
        "category": gv(f, "category") or "Other", "sub": gv(f, "subCategory"),
        "img": imgs[0].get("stringValue", "") if imgs else "",
    })
print("products:", len(prods))

# 2. resolve images (local furniture + download others)
for i, p in enumerate(prods):
    dst = f"{IMG}/{i}.jpg"
    src = p["img"]; ok = False
    if "auranestdecors.com/assets/products/" in src:
        fn = src.split("/assets/products/")[-1]
        if os.path.exists(f"assets/products/{fn}"):
            shutil.copy(f"assets/products/{fn}", dst); ok = True
    if not ok and src:
        try:
            req = urllib.request.Request(src, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=40) as r:
                open(dst, "wb").write(r.read())
            ok = True
        except Exception as e:
            print("IMG FAIL", i, str(e)[:80])
    if ok:
        try:
            from PIL import Image
            im = Image.open(dst).convert("RGB")
            im.thumbnail((720, 720), Image.LANCZOS)
            im.save(dst, "JPEG", quality=82)
        except Exception as e:
            print("resize skip", i, str(e)[:60])
    p["local"] = os.path.abspath(dst) if ok else ""

# 3. order: Furniture first, then by category
order = ["Aesthetic Furniture", "Minimal", "Woodcraft", "Artisan", "Giftings", "Other"]
prods.sort(key=lambda p: (order.index(p["category"]) if p["category"] in order else 99, p["name"]))

def money(v):
    try: return "₹" + format(int(v), ",")
    except: return ""

cards = []
for p in prods:
    img = f'<img src="file://{p["local"]}"/>' if p["local"] else '<div class="noimg">AuraNest</div>'
    tag = html.escape(p["sub"] or p["category"])
    cards.append(f'''<div class="card">
      <div class="imgwrap">{img}<span class="tag">{tag}</span></div>
      <div class="body"><div class="nm">{html.escape(p["name"])}</div></div></div>''')

page = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@page {{ size: A4; margin: 14mm 12mm; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: Georgia, 'Times New Roman', serif; color: #282522; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
.cover {{ height: 262mm; position: relative; background: #263B32; color: #F5F0E8; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; page-break-after: always; }}
.cover h1 {{ font-size: 54px; font-weight: 400; letter-spacing: 2px; }}
.cover .rule {{ width: 120px; height: 2px; background: #C5A47E; margin: 22px 0; }}
.cover .sub {{ font-size: 20px; letter-spacing: 6px; text-transform: uppercase; color: #D8C3A4; }}
.cover .yr {{ font-size: 15px; margin-top: 30px; color: rgba(245,240,232,.7); letter-spacing: 3px; }}
.cover .ct {{ position: absolute; bottom: 26mm; font-size: 13px; color: rgba(245,240,232,.75); letter-spacing: 1px; }}
.sech {{ font-size: 24px; color: #80634A; font-weight: 400; margin: 10px 0 14px; padding-bottom: 6px;
  border-bottom: 1.5px solid #e3d8c6; letter-spacing: .5px; break-after: avoid; }}
.grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 7mm 6mm; }}
.card {{ border: 1px solid #e8dfcf; border-radius: 8px; overflow: hidden; break-inside: avoid; background: #fff; }}
.imgwrap {{ position: relative; aspect-ratio: 1/1; background: #fff; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #f0e9da; }}
.imgwrap img {{ width: 100%; height: 100%; object-fit: contain; }}
.noimg {{ color: #c5a47e; font-size: 13px; font-style: italic; }}
.tag {{ position: absolute; top: 6px; left: 6px; background: rgba(255,255,255,.92); color: #80634A;
  font-family: Arial, sans-serif; font-size: 7.5px; letter-spacing: .5px; text-transform: uppercase; padding: 3px 7px; border-radius: 20px; }}
.body {{ padding: 8px 9px 11px; }}
.nm {{ font-family: Arial, sans-serif; font-size: 9.5px; line-height: 1.35; color: #3a352f; height: 38px; overflow: hidden; }}
.pr {{ margin-top: 6px; font-size: 14px; color: #263B32; font-weight: bold; }}
.mrp {{ font-size: 10px; color: #a79b88; text-decoration: line-through; font-weight: normal; margin-left: 4px; }}
</style></head><body>
<div class="cover">
  <div class="sub">Handcrafted Home Décor</div>
  <div class="rule"></div>
  <h1>AuraNest Decors</h1>
  <div class="rule"></div>
  <div class="yr">CATALOGUE · 2026</div>
  <div class="ct">auranestdecors.com &nbsp;·&nbsp; +91 97591 25330</div>
</div>
'''

# group by category into sections
secs = {}
for p, c in zip(prods, cards):
    secs.setdefault(p["category"], []).append(c)
NAMES = {"Aesthetic Furniture": "Furniture", "Minimal": "Décor & Planters", "Woodcraft": "Woodcraft & Serveware",
         "Artisan": "Artisan", "Giftings": "Giftings", "Other": "More"}
for cat in order:
    if cat in secs:
        page += f'<div class="sech">{NAMES.get(cat, cat)}</div><div class="grid">{"".join(secs[cat])}</div>'
page += "</body></html>"

html_path = os.path.abspath(f"{OUT}/catalog.html")
open(html_path, "w").write(page)
print("html written:", html_path)

# 4. render via Node Playwright (pre-installed)
pdf_path = os.path.abspath(f"{OUT}/AuraNest-Catalogue.pdf")
subprocess.run(["node", "scripts/render_pdf.js", html_path, pdf_path], check=True)
print("PDF:", pdf_path, os.path.getsize(pdf_path), "bytes")
