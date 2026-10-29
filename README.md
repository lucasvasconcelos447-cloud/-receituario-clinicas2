# Receituário

Primeira versão de documentos profissionais para clínicas, independente do Agendamento Turbo. Aplicação Next.js com autenticação Supabase, PostgreSQL com RLS, arquivos privados e PDF vetorial com fontes incorporadas.

## Executar

Requisitos: Node.js 24 LTS e npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com a URL e chave **publicável** do seu projeto Supabase. Nunca adicione `service_role` ou chave administrativa. Configure `NEXT_PUBLIC_APP_URL` com a origem HTTPS da instalação (ou `http://localhost:3000` localmente). Abra o endereço exibido pelo servidor.

```sh
npm run typecheck
npm test
npm run build
npm start
```

O build usa Webpack para evitar as restrições de links simbólicos encontradas no Windows deste ambiente. `package-lock.json` registra as versões instaladas.

## Estrutura

- `src/app`: páginas, ações autenticadas, callbacks e APIs.
- `src/lib/context.ts`: sessão verificada e estabelecimento obtido pelo servidor.
- `src/lib/validation.ts`: validação dos dados e requisitos para geração.
- `src/lib/pdf`: PDF A4/A5, fontes incorporadas, múltiplas páginas.
- `src/components`: formulários, editor por etapas, prévia, instalação e arquivos.
- `supabase/migrations`: schema inicial recuperado do projeto e complemento aplicado.
- `tests`: validações e SQL de isolamento transacional.
- `scripts/pdf-qa.ts`: arquivos de teste com dados exclusivamente fictícios.

## Recursos implementados

Cadastro, login, confirmação conforme Supabase, recuperação de senha, logout, proteção no servidor; criação de estabelecimento; perfil profissional; upload PNG/JPEG/WebP até 2 MB com decodificação, limites de pixels e reprocessamento; identidade com três layouts, duas fontes, cores, logo proporcional, rodapé e papel; pacientes com busca e edição; modelos próprios de texto com edição/exclusão; editor com etapas, prévia, confirmação real de salvamento e detecção de conflito; rascunhos reabertos e duplicados; geração de PDFs preenchidos e em branco; histórico com versões e arquivos imutáveis; download autenticado e compartilhamento nativo quando disponível; manifest, ícones, instalação e página sem conexão.

A tabela `document_versions` consolida os metadados de arquivo, caminho privado e snapshot. Não há tabela separada `document_files`. A preparação para equipes está em `organization_members`, mas a autorização atual permite somente o responsável, sem convites ou edição de membros.

## Banco e Storage

Projeto autorizado: `receituario-clinicas` (`iztqjhkqihygiavvhins`). Não aplicar em banco de outro produto.

As migrações registradas em `supabase/migrations` correspondem às aplicadas no projeto. Para um novo projeto, revise os arquivos e use o fluxo de migração oficial do Supabase. Não reaplique a migração inicial no projeto existente.

- RLS em todas as tabelas expostas e verificação de proprietário no servidor.
- FKs compostas impedem vínculos de paciente/documento entre organizações.
- `clinical-private` é privado. Objetos usam `organization_id/logos/UUID.png` e `organization_id/pdfs/UUID.pdf`.
- Sem políticas de atualização/exclusão dos objetos históricos ou versões.
- Download passa pela API autenticada; não existem links públicos permanentes nem URLs assinadas expostas.
- Snapshot inclui logo em base64, identidade, profissional, paciente, texto e data. Download anterior usa os bytes armazenados.
- Finalização de versão serializa por documento e exige o horário da revisão utilizada na geração.
- Se upload ocorrer e a finalização falhar, pode restar um objeto órfão privado. Definir rotina de limpeza com período de segurança antes da operação real.
- Eventos de auditoria contêm ação e identificadores; não copiam conteúdo clínico.
- O schema inicial já estava presente e vazio quando esta implementação começou.

## Autenticação

No painel Supabase Auth, configure Site URL e Redirect URLs com a origem da aplicação e `/auth/callback` (incluindo o callback local para desenvolvimento). A recuperação usa `/auth/callback?next=/nova-senha`. Não aceite redirecionamentos arbitrários.

Se usar e-mails com token hash, configure confirmação como `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email` e recuperação como `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`.

Habilite confirmação de e-mail conforme a política de operação, SMTP próprio e proteção contra senhas vazadas. O advisor consultado apontou proteção contra senhas vazadas desativada; ela não foi alterada nesta implementação. Não foi validado o recebimento de e-mails reais.

## PDF e assinatura

`@react-pdf/renderer` foi escolhido por gerar texto selecionável e layout vetorial em Node.js, sem navegador headless, com paginação e fontes TTF locais. As fontes Noto e sua licença estão em `assets/fonts`. A paginação final é adicionada aos bytes ainda não assinados com `pdf-lib`, antes de salvar a versão. Nenhum arquivo assinado é alterado. O rastreamento do build inclui as fontes na função de PDF da Vercel.

A4: 210 × 297 mm. A5: 148 × 210 mm. A prévia HTML é contínua; a paginação definitiva está no PDF. Abra o PDF para conferir antes de imprimir, usando tamanho real/100% na impressão. A função não envia dados a assinadores. O link gov.br apenas abre o serviço oficial, onde a profissional envia e baixa o arquivo por conta própria. Nenhum documento é marcado como assinado.

Receituário em branco é gerado sem carregar documentos ou pacientes, com metadados e nome de arquivo genéricos. Sem sangria, marcas de corte, CMYK ou PDF/X. Confirme requisitos especiais com a gráfica.

A prescrição simples de enfermagem inclui instituição/CNPJ, identificação do protocolo/ano/órgão aprovador, profissional/conselho/UF/CPF, paciente/nascimento/sexo/endereço e confirmação de revisão. Referência consultada: https://www.cofen.gov.br/resolucao-cofen-no-801-de-14-de-janeiro-de-2026/ . Não há suporte a controle especial ou receitas sujeitas à retenção. O software não determina competência legal, medicamento, dose ou exame. Revisão regulatória e profissional permanece necessária antes de operação real.

## PWA e privacidade

`public/sw.js` só armazena os quatro recursos públicos expressamente listados. Não armazena páginas autenticadas, pacientes, respostas da API ou PDFs. A instalação não fornece edição clínica offline. Falhas de conexão não são tratadas como salvamento bem-sucedido. Dados clínicos não são persistidos em localStorage.

A opção Instalar aplicativo usa o convite nativo quando disponível e fornece instruções alternativas para iPhone/navegadores. Atualizações exigem ação explícita com aviso para salvar primeiro. Instalação e compartilhamento dependem do navegador/aparelho e devem ser testados em aparelhos reais.

## Publicação

Aplicativo: **https://receituario-clinicas.vercel.app**

Código-fonte: https://github.com/lucasvasconcelos447-cloud/-receituario-clinicas2 (repositório público indicado pelo usuário).

- Vercel: `receituario-clinicas`, projeto `prj_DMx4QUmePlOAmVGH9jd9bpUnPq0X`, equipe `lucas-celos-projects`.
- Supabase: `receituario-clinicas`, projeto `iztqjhkqihygiavvhins`, região São Paulo.
- Node.js 24, Next.js e build Webpack. O pacote da função de PDF inclui as fontes Noto e os módulos de fontes padrão do PDFKit necessários no Linux da Vercel.
- As variáveis públicas da conexão foram configuradas na Vercel; nenhuma chave administrativa é utilizada no navegador ou no código.
- A publicação desta entrega usa a API da Vercel a partir de um commit específico do GitHub. O gatilho automático a cada push ainda não está configurado no projeto; para automatizar futuras publicações, vincule o repositório em Settings → Git na Vercel.

Site URL confirmado: `https://receituario-clinicas.vercel.app`.

Destinos de autenticação confirmados:

- `https://receituario-clinicas.vercel.app/auth/callback`
- `https://receituario-clinicas.vercel.app/auth/callback?next=/nova-senha`

A conferência dos destinos não envia e-mails e não substitui a validação de entrega de confirmação/recuperação em uma caixa de entrada real. Para uso por clientes, configure um provedor SMTP próprio conforme os requisitos do Supabase. Não desative a confirmação de e-mail apenas para contornar limites do remetente de desenvolvimento.

Para outra instalação, configure as variáveis de ambiente e os destinos de autenticação com o seu domínio. Não use o banco de outro produto.

## Pendências de operação

Definir retenção/exclusão, exportação de dados, termos e privacidade, base legal e contratos com fornecedores, backups/restauração, suporte e resposta a incidentes. Não se declara conformidade integral com LGPD ou prontuário certificado. Não há cobrança, agenda, IA clínica ou assinatura integrada.

Veja `VALIDACAO.md` para evidências e limitações dos testes.
