from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "docs" / "professional" / "assets"
SCREENS = ASSETS / "screens-light"
OUT = ROOT / "docs" / "deck" / "UNDERWRITE_PITCH_DECK.pptx"

NAVY = "08182F"; INK = "101827"; PAPER = "F7F5EF"; WHITE = "FFFFFF"
BLUE = "1769FF"; CYAN = "18D4C5"; LIME = "CCFF27"; AMBER = "FFB547"
RED = "EF5A5A"; MUTED = "647084"; LINE = "D8DEE8"; CARD = "FFFFFF"
FONT = "Segoe UI"; MONO = "Cascadia Mono"

prs = Presentation()
prs.slide_width = Inches(13.333333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]

def rgb(h): return RGBColor.from_string(h)

def rect(slide, x, y, w, h, fill, line=None, radius=False, transparency=0):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shp.fill.solid(); shp.fill.fore_color.rgb = rgb(fill); shp.fill.transparency = transparency
    shp.line.color.rgb = rgb(line or fill)
    if radius: shp.adjustments[0] = 0.08
    return shp

def line(slide, x1, y1, x2, y2, color=LINE, width=1.2, dash=None):
    s = slide.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    s.line.color.rgb = rgb(color); s.line.width = Pt(width)
    if dash: s.line.dash_style = dash
    return s

def text(slide, value, x, y, w, h, size=18, color=INK, bold=False, font=FONT, align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, margin=0, tracking=None):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    box.text_frame.clear(); box.text_frame.margin_left = box.text_frame.margin_right = Inches(margin); box.text_frame.margin_top = box.text_frame.margin_bottom = Inches(margin)
    box.text_frame.vertical_anchor = valign; box.text_frame.word_wrap = True
    p = box.text_frame.paragraphs[0]; p.text = value
    # PowerPoint creates a new paragraph for every newline. Style every run so
    # multiline titles retain the intended colour and type treatment.
    for para in box.text_frame.paragraphs:
        para.alignment = align; para.space_after = Pt(0); para.space_before = Pt(0)
        for r in para.runs:
            r.font.name = font; r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = rgb(color)
            if tracking is not None: r.font._element.set("spc", str(tracking))
    return box

def pill(slide, label, x, y, w, fill, color, line_color=None):
    rect(slide,x,y,w,.32,fill,line_color or fill,True)
    text(slide,label.upper(),x,y+.015,w,.26,7.5,color,True,align=PP_ALIGN.CENTER,valign=MSO_ANCHOR.MIDDLE)

def base(dark=False, number=None, section=None):
    slide = prs.slides.add_slide(BLANK)
    rect(slide,0,0,13.333,7.5,NAVY if dark else PAPER)
    if number is not None:
        text(slide,f"{number:02d}",.42,7.12,.4,.18,7,"8DA0B9" if dark else MUTED,True)
        text(slide,"UNDERWRITE · 2026 SHENZHEN FINTECHATHON",.86,7.12,4.2,.18,7,"8DA0B9" if dark else MUTED,False)
        text(slide,section or "",10.0,7.12,2.9,.18,7,"8DA0B9" if dark else MUTED,True,align=PP_ALIGN.RIGHT)
        line(slide,.42,7.02,12.9,7.02,"2B3B54" if dark else LINE,.7)
    return slide

def heading(slide, eyebrow, title, dark=False, x=.55, y=.38, w=12.1):
    text(slide,eyebrow.upper(),x,y,w,.24,8,CYAN if dark else BLUE,True)
    text(slide,title,x,y+.34,w,.72,29,WHITE if dark else INK,True)

def card(slide, x, y, w, h, title, body, accent=BLUE, dark=False):
    rect(slide,x,y,w,h,"132540" if dark else WHITE,"263B59" if dark else LINE,True)
    rect(slide,x,y,.07,h,accent,accent)
    text(slide,title,x+.25,y+.22,w-.46,.34,13,WHITE if dark else INK,True)
    text(slide,body,x+.25,y+.65,w-.45,h-.78,10.5,"C7D2E2" if dark else MUTED,False)

def picture_fill(slide, path, x, y, w, h, line_color=None):
    path = Path(path)
    imw, imh = Image.open(path).size
    target = w/h; source = imw/imh
    pic = slide.shapes.add_picture(str(path), Inches(x), Inches(y), width=Inches(w), height=Inches(h))
    if source > target:
        visible = target/source; crop=(1-visible)/2; pic.crop_left=pic.crop_right=crop
    elif source < target:
        visible = source/target; crop=(1-visible)/2; pic.crop_top=pic.crop_bottom=crop
    if line_color:
        pic.line.color.rgb=rgb(line_color); pic.line.width=Pt(1.2)
    return pic

def arrow(slide, x1, y1, x2, y2, color=BLUE):
    s=line(slide,x1,y1,x2,y2,color,2.2); s.line.end_arrowhead=True; return s

# 01 — Cover
s=base(True,1,"OPEN")
text(s,"INTERNATIONAL TRACK · TOPIC F",.62,.55,5,.28,9,CYAN,True)
text(s,"Authority\nmust be earned.",.62,1.18,7.2,1.75,39,WHITE,True)
text(s,"An autonomous payment wallet where spending authority is measured, enforced on-chain, and collateral-backed.",.67,3.23,6.2,.9,16,"C9D3E2")
pill(s,"Working prototype",.67,4.38,1.62,"D9F8EE","06765E")
pill(s,"Real Base Sepolia",2.42,4.38,1.73,"FFF0D7","8B5300")
rect(s,8.4,-1.15,5.7,5.7,"0D2341","1769FF",True)
rect(s,9.25,-.55,5.3,5.3,"08182F","18D4C5",True)
text(s,"UNDERWRITE",8.76,1.13,4.03,.65,29,WHITE,True,align=PP_ALIGN.RIGHT)
rect(s,11.16,1.94,1.62,.08,LIME,LIME)
text(s,"Evidence → Authority → Settlement",8.86,2.32,3.9,.35,10,"9EABC0",False,align=PP_ALIGN.RIGHT)

# 02 — Problem
s=base(False,2,"PROBLEM"); heading(s,"The control gap","Intelligence cannot be its own spending policy")
text(s,"A financial agent can be useful and still be wrong, manipulated, or compromised. Prompt instructions are not a custody control.",.57,1.45,8.8,.7,15,MUTED)
card(s,.57,2.35,3.85,2.05,"Prompt injection","A poisoned invoice turns untrusted content into a payment instruction.",RED)
card(s,4.72,2.35,3.85,2.05,"Hallucinated intent","A model invents or confuses a vendor, amount, purchase order, or urgency.",AMBER)
card(s,8.87,2.35,3.85,2.05,"Key compromise","An attacker bypasses the model and calls the wallet with the agent key.",BLUE)
rect(s,.57,4.78,12.15,1.25,NAVY,NAVY,True)
text(s,"The question is not “Can the model pay?”",.86,4.96,11.56,.30,15,WHITE,True,align=PP_ALIGN.CENTER)
text(s,"Who measured, granted, bounded, and can revoke that authority?",.86,5.38,11.56,.32,15,LIME,True,align=PP_ALIGN.CENTER)

# 03 — Thesis
s=base(False,3,"SOLUTION"); heading(s,"The thesis","Measure risk. Compile authority. Enforce the envelope.")
nodes=[("01","EXAM","Exact agent configuration faces benign and adversarial scenarios",BLUE),("02","COMPILE","Conservative risk bounds become tiered limits",CYAN),("03","ACTIVATE","Examiner signs; owner consents on-chain",AMBER),("04","ENFORCE","Vault, challenge window and bond contain failure",LIME)]
x=.57
for i,(n,t,b,c) in enumerate(nodes):
    rect(s,x,2.03,2.72,2.72,WHITE,LINE,True); text(s,n,x+.22,2.25,.55,.36,11,c,True); text(s,t,x+.22,2.78,2.2,.36,17,INK,True); text(s,b,x+.22,3.35,2.25,.98,10.5,MUTED)
    if i<3: arrow(s,x+2.78,3.38,x+3.05,3.38,BLUE)
    x+=3.08
text(s,"The model proposes. Deterministic software decides. The contract enforces.",.62,5.43,12.0,.55,22,INK,True,align=PP_ALIGN.CENTER)
text(s,"Authority is evidence-bound, per configuration, time-limited and removable without the agent’s cooperation.",1.55,6.12,10.2,.36,12,MUTED,align=PP_ALIGN.CENTER)

# 04 — Product
s=base(True,4,"PRODUCT"); heading(s,"Working product","A judge can see the boundary, not just hear about it",True)
picture_fill(s,SCREENS/"home.png",.57,1.48,8.15,4.85,"2E425E")
card(s,9.0,1.48,3.72,1.22,"1 · Business proposal","The agent starts from an invoice and vendor ID.",CYAN,True)
card(s,9.0,2.91,3.72,1.22,"2 · Layered decision","Agent → policy → contract → funds is visible.",BLUE,True)
card(s,9.0,4.34,3.72,1.22,"3 · Evidence label","Simulated UI and real testnet proof are never conflated.",AMBER,True)
pill(s,"Light UI · scripted demo",9.0,5.87,2.35,"22324A","DDE7F5","425A7A")

# 05 — Boundary
s=base(False,5,"ARCHITECTURE"); heading(s,"Trust architecture","One narrow path from language to money")
tiers=[("UNTRUSTED","Invoice + LLM","Reads, extracts, proposes",RED),("DETERMINISTIC","Registry + policy","Resolves, validates, classifies",BLUE),("SIGNED","Role keys","Attests and consents",AMBER),("ON-CHAIN","Vault + BondPool","Enforces and settles",CYAN)]
x=.57
for i,(cap,name,body,c) in enumerate(tiers):
    rect(s,x,2.08,2.72,2.45,WHITE,LINE,True); pill(s,cap,x+.2,2.28,1.35,c,WHITE); text(s,name,x+.2,2.9,2.28,.55,16,INK,True); text(s,body,x+.2,3.55,2.25,.55,10.5,MUTED)
    if i<3: arrow(s,x+2.78,3.32,x+3.05,3.32,BLUE)
    x+=3.08
rect(s,.57,5.08,12.15,.9,NAVY,NAVY,True)
text(s,"Hard rule",.84,5.34,1.15,.3,10,LIME,True)
text(s,"The LLM never chooses an address, token, calldata, or spending limit.",2.02,5.25,10.25,.42,17,WHITE,True)

# 06 — Exam + compiler
s=base(False,6,"EARN"); heading(s,"Evidence to authority","The exact configuration earns—or is denied—autonomy")
picture_fill(s,SCREENS/"exam.png",.57,1.48,6.25,4.72,LINE)
text(s,"COMPILER OUTPUT",7.18,1.55,2.5,.25,9,BLUE,True)
card(s,7.18,1.95,2.62,1.25,"T1 per transaction","0 MockUSDC",RED)
card(s,10.08,1.95,2.62,1.25,"T1 per window","0 MockUSDC",RED)
card(s,7.18,3.48,2.62,1.25,"T2 per request","2,000 MockUSDC",CYAN)
card(s,10.08,3.48,2.62,1.25,"Decision","UTILITY_GATE",AMBER)
text(s,"Current honest gamma result",7.18,5.1,5.5,.35,14,INK,True)
text(s,"The safety gate refused autonomous T1 authority. The system preserved bounded T2 with a human challenge window. No limit was manually overridden.",7.18,5.55,5.45,.72,11,MUTED)
pill(s,"Light UI · scripted demo values",.57,6.42,2.55,"FFF0D7","8B5300")

# 07 — Permission tiers
s=base(True,7,"PERMISSION"); heading(s,"Permission ladder","Fast when justified. Interruptible when uncertain.",True)
levels=[("T0","READ","Observe balances and business records","7A8AA3"),("T1","AUTO","Execute only inside compiled envelope",CYAN),("T2","DELAY","Reserve → challenge → revalidate → execute",AMBER),("T3","BLOCK","No autonomous action",RED)]
y=1.62
for n,t,b,c in levels:
    rect(s,.72,y,11.88,.9,"10233E","29405F",True); rect(s,.72,y,.12,.9,c,c); text(s,n,1.02,y+.2,.72,.4,18,c,True); text(s,t,1.86,y+.22,1.05,.34,12,WHITE,True); text(s,b,3.03,y+.2,8.9,.42,12,"C7D2E2"); y+=1.12
text(s,"Grant",.75,6.27,.75,.3,10,LIME,True); text(s,"examiner evidence + owner activation",1.55,6.22,3.6,.4,13,WHITE,True)
text(s,"Remove",6.8,6.27,.82,.3,10,RED,True); text(s,"owner · examiner · claim suspension · expiry",7.65,6.22,4.7,.4,13,WHITE,True)

# 08 — On-chain proof
s=base(False,8,"PROOF"); heading(s,"Real execution evidence","Four public transactions. One coherent Tier-2 path.")
stages=[("COMMIT","0x3fd7…f58f","ExamCommitted · commit 5",BLUE),("ACTIVATE","0x9e3b…9d8c","T1 = 0 · T2 enabled",CYAN),("REQUEST","0x20a2…94f6","Pending request ID 2",AMBER),("EXECUTE","0xf19d…d712","Payment record 1 · Tier 2",LIME)]
x=.57
for i,(t,h,b,c) in enumerate(stages):
    rect(s,x,1.78,2.75,2.05,WHITE,LINE,True); pill(s,t,x+.2,1.98,1.08,c,WHITE); text(s,h,x+.2,2.57,2.25,.32,12,INK,True,MONO); text(s,b,x+.2,3.03,2.28,.48,9.5,MUTED)
    if i<3: arrow(s,x+2.8,2.8,x+3.03,2.8,BLUE)
    x+=3.08
rect(s,.57,4.25,8.55,1.38,NAVY,NAVY,True)
text(s,"Receipt status",.83,4.51,1.2,.28,9,"9EB0C8",True); text(s,"SUCCESS",.83,4.86,1.6,.34,17,LIME,True)
text(s,"Decoded input",2.62,4.51,1.35,.28,9,"9EB0C8",True); text(s,"executePending(2)",2.62,4.86,2.35,.34,15,WHITE,True,MONO)
text(s,"Matching event",5.4,4.51,1.35,.28,9,"9EB0C8",True); text(s,"PaymentExecuted · tier 2",5.4,4.86,3.15,.34,15,WHITE,True)
qr = picture_fill(s,ASSETS/"qr-execution.png",9.62,4.16,1.5,1.5)
qr.click_action.hyperlink.address = "https://sepolia.basescan.org/tx/0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712"
text(s,"Inspect the final\nBase Sepolia receipt",11.22,4.47,1.4,.65,10,MUTED,True)
pill(s,"Controlled · 35 MockUSDC · no customer funds",.57,6.14,3.55,"FFF0D7","8B5300")

# 09 — Containment
s=base(True,9,"CONTAIN"); heading(s,"Assume compromise","The contract remains the last line of defense",True)
picture_fill(s,SCREENS/"attack.png",.57,1.47,7.55,4.95,"2E425E")
card(s,8.42,1.47,4.3,1.22,"Recipient boundary","Unregistered or inactive payees revert on-chain.",RED,True)
card(s,8.42,2.91,4.3,1.22,"Amount + window boundary","Per-tx, global window and recipient caps recheck.",AMBER,True)
card(s,8.42,4.35,4.3,1.22,"Exposure boundary","Unreconciled T1 exposure cannot exceed remaining bond.",CYAN,True)
pill(s,"Light UI · explicitly simulated",8.42,5.88,3.05,"22324A","DDE7F5","425A7A")

# 10 — Experiment
s=base(False,10,"MEASURE"); heading(s,"Controlled evaluation","Safety improves—and autonomy is intentionally rationed")
text(s,"9 conditions · 330 invoices each · 2,970 controlled executions · non-independent",.58,1.34,8.2,.35,12,MUTED)
agents=[("alpha",100.0,0.0,38700,0),("beta",87.5,5.42,6010,0),("gamma",96.25,15.83,170,5)]
y=2.0
for name,r0,r2,l0,l2 in agents:
    text(s,name.upper(),.62,y+.04,.7,.3,11,INK,True)
    text(s,"automation",1.42,y+.04,1.0,.3,9,MUTED,True)
    rect(s,2.42,y,4.15,.23,"E1E6ED",LINE,True); rect(s,2.42,y,4.15*r0/100,.23,RED,RED,True)
    text(s,f"R0 {r0:.2f}%",6.75,y-.03,1.05,.3,9,RED,True)
    rect(s,2.42,y+.38,4.15,.23,"E1E6ED",LINE,True); rect(s,2.42,y+.38,4.15*r2/100,.23,CYAN,CYAN,True)
    text(s,f"R2 {r2:.2f}%",6.75,y+.35,1.05,.3,9,"09806C",True)
    text(s,"net loss",8.15,y+.04,.82,.3,9,MUTED,True); text(s,f"R0 {l0:,}",9.1,y-.03,1.25,.3,12,RED,True); text(s,f"R2 {l2:,}",10.5,y-.03,1.25,.3,12,"09806C",True)
    y+=1.25
rect(s,.57,5.96,12.15,.72,"FFF6E8","F0D4A8",True)
text(s,"Interpretation",.83,6.18,1.15,.27,9,"8B5300",True)
text(s,"R2 recorded zero Class-I violations for all three agents, but shifted more work to review. Values are synthetic MockUSDC accounting—not customer losses.",2.02,6.12,10.25,.4,10.5,INK)

# 11 — Assurance
s=base(False,11,"ASSURE"); heading(s,"Assurance case","Evidence, not adjectives")
metrics=[("101","contract tests","17 suites · 0 failed",BLUE),("159","engine tests","26 files · 0 failed",CYAN),("25,600","invariant calls","256 campaigns",AMBER),("14","safety invariants","exact test mapping",RED)]
x=.57
for v,t,b,c in metrics:
    rect(s,x,1.72,2.78,1.55,WHITE,LINE,True); text(s,v,x+.22,1.98,2.3,.44,24,c,True); text(s,t,x+.22,2.47,2.2,.28,10,INK,True); text(s,b,x+.22,2.82,2.2,.24,8,MUTED); x+=3.12
card(s,.57,3.68,3.84,1.62,"Agentic threats","OWASP-informed review of goal hijack, tool misuse, identity abuse, supply chain and cascading failure.",RED)
card(s,4.72,3.68,3.84,1.62,"Smart-contract controls","Recipient, qualification, invoice, limits, exposure, reserve, pause, claim and replay defenses.",BLUE)
card(s,8.87,3.68,3.84,1.62,"Known risks","Central signers, self-authored evaluation and demo-key custody remain explicitly disclosed.",AMBER)
pill(s,"Self-assessment · not independently audited",.57,5.87,2.95,"FEE3E3","AD2E2E")

# 12 — Differentiation
s=base(True,12,"WHY NOW"); heading(s,"What is distinctive","Evidence is mechanically coupled to financial authority",True)
rows=[("Typical agent wallet","Owner types a limit","Policy / contract rules","Usually none"),("Smart account controls","Owner configures policy","On-chain modules","Optional"),("UNDERWRITE","Exam + compiler size authority","Vault enforces same envelope","Bond limits unreconciled T1 exposure")]
text(s,"SYSTEM",.62,1.63,2.1,.24,8,"8DA0B9",True); text(s,"AUTHORITY SOURCE",3.05,1.63,2.7,.24,8,"8DA0B9",True); text(s,"ENFORCEMENT",6.25,1.63,2.7,.24,8,"8DA0B9",True); text(s,"RESIDUAL RISK",9.25,1.63,3.15,.24,8,"8DA0B9",True)
y=2.0
for i,row in enumerate(rows):
    fill="10233E" if i<2 else "17304A"; edge="29405F" if i<2 else CYAN
    rect(s,.57,y,12.15,.92,fill,edge,True); text(s,row[0],.78,y+.27,2.1,.3,11,LIME if i==2 else WHITE,True); text(s,row[1],3.05,y+.25,2.75,.34,10,"C7D2E2"); text(s,row[2],6.25,y+.25,2.65,.34,10,"C7D2E2"); text(s,row[3],9.25,y+.2,3.15,.48,10,"C7D2E2"); y+=1.12
text(s,"Not claimed",.62,5.64,1.2,.28,9,RED,True); text(s,"We are not ‘the only’ secure wallet, not audited, and not production-ready.",1.83,5.57,5.4,.4,12,WHITE,True)
text(s,"Claimed",7.45,5.64,.9,.28,9,CYAN,True); text(s,"A working evidence → authority → bond coupling with public receipts.",8.35,5.57,4.25,.5,12,WHITE,True)

# 13 — Close
s=base(True,13,"CLOSE")
text(s,"UNDERWRITE",.62,.58,3.2,.35,12,LIME,True)
text(s,"Do not trust an agent\nwith unlimited authority.",.62,1.3,9.5,1.25,34,WHITE,True)
text(s,"Give it the authority its evidence can support—then enforce that boundary where the money moves.",.62,3.0,8.45,.92,18,"C9D3E2")
rect(s,.62,4.44,7.75,1.15,"10233E","29405F",True)
text(s,"REAL BASE SEPOLIA PROOF",.9,4.7,2.15,.24,9,CYAN,True)
text(s,"0xf19d5e…827ad712",.9,5.06,3.25,.3,14,WHITE,True,MONO)
text(s,"Receipt success · executePending(2) · PaymentExecuted · Tier 2",4.38,4.79,3.6,.5,10,"C7D2E2",True,align=PP_ALIGN.RIGHT)
qr = picture_fill(s,ASSETS/"qr-execution.png",9.48,4.25,1.55,1.55)
qr.click_action.hyperlink.address = "https://sepolia.basescan.org/tx/0xf19d5e201545fbe71c83c0dbd62af34a398a0414979bdaccd30fe2de827ad712"
text(s,"Scan to verify",9.22,5.93,2.05,.3,9,"9EABC0",True,align=PP_ALIGN.CENTER)
text(s,"Technical dossier · Security self-assessment · On-chain evidence · Source + tests",.62,6.42,8.6,.35,10,"8DA0B9")

prs.save(OUT)
print(OUT)
