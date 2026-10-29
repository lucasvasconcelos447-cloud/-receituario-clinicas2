from pathlib import Path
from pypdf import PdfReader
import pypdfium2 as pdfium
root=Path('work/pdf-qa')
for file in sorted(root.glob('*.pdf')):
 reader=PdfReader(file)
 pages=reader.pages
 expected=(595.28,841.89) if file.name.startswith('A4') else (419.53,595.28)
 for page in pages:
  assert abs(float(page.mediabox.width)-expected[0])<.05
  assert abs(float(page.mediabox.height)-expected[1])<.05
 text='\n'.join(p.extract_text() for p in pages)
 if 'blank' in file.name:
  assert len(pages)==1
  assert 'NÃO EXPORTAR' not in text and 'ID-FICTICIO-SENSIVEL' not in text
  assert '1990' not in str(reader.metadata)
 else:
  assert 'Paciente Fictício' in text
 if 'short' in file.name:
  assert 'atenção, coração, saúde, João, ação' in text
 assert 'Sem assinatura eletrônica' in text
 assert 'Página 1 de' in text
 doc=pdfium.PdfDocument(str(file))
 for index in {0,len(pages)-1}:
  doc[index].render(scale=1.1).to_pil().save(str(root/f'{file.stem}-p{index+1}.png'))
 print(file.name, len(pages), 'páginas: dimensões, conteúdo e metadados OK')
