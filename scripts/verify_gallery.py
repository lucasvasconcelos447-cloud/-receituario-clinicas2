from pathlib import Path
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image,ImageDraw
root=Path('work/gallery-qa');out=Path('public/templates');out.mkdir(exist_ok=True)
files=list(root.glob('*.pdf'));assert len(files)==84
for f in files:
 r=PdfReader(f);expected=(595.28,841.89) if '-A4-' in f.name else (419.53,595.28)
 for page in r.pages:
  assert abs(float(page.mediabox.width)-expected[0])<.05
  assert abs(float(page.mediabox.height)-expected[1])<.05
  text=page.extract_text()
  assert 'Sem assinatura eletrônica' in text
  assert '\ufffd' not in text
 text='\n'.join(p.extract_text() for p in r.pages)
 if '-blank' in f.name:
  assert len(r.pages)==1,(f,len(r.pages))
  assert 'Paciente Exemplo' not in text and 'ID-FICTICIO' not in text
 else: assert 'Paciente Exemplo' in text
 if '-long' in f.name: assert len(r.pages)>2 and '90.' in text
 if '-short' in f.name: assert len(r.pages)==1,(f,len(r.pages))
 if '-A4-short' in f.name:
  doc=pdfium.PdfDocument(str(f));doc[0].render(scale=.6).to_pil().save(out/(f.name.split('-')[0]+'.png'))
print('84 PDFs: tamanhos, texto, paginação e proteção do papel em branco OK')
items=[root/f'{d}-A4-short.pdf' for d in ['minimalista','classico','botanico','floral','geometrico','institucional']]
canvas=Image.new('RGB',(1080,1060),'#e6ebe6');draw=ImageDraw.Draw(canvas)
for i,f in enumerate(items):
 doc=pdfium.PdfDocument(str(f));im=doc[0].render(scale=.55).to_pil().convert('RGB');im.thumbnail((330,470));x=(i%3)*360+15;y=(i//3)*530+30;canvas.paste(im,(x,y));draw.text((x,y-20),f.stem,fill='black')
canvas.save(root/'contact-sheet.png')
for name in ['floral-A5-portrait','botanico-A4-wide','classico-A5-long','institucional-A5-blank']:
 doc=pdfium.PdfDocument(str(root/(name+'.pdf')));doc[len(doc)-1].render(scale=1.4).to_pil().save(root/(name+'-last.png'))
