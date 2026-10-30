alter table public.document_branding drop constraint document_branding_template_check;
alter table public.document_branding add constraint document_branding_template_check check (template in ('minimalista','classico','floral','botanico','geometrico','institucional'));
