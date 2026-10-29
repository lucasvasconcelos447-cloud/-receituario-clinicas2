# Estado de validação

Aplicação publicada em https://receituario-clinicas.vercel.app. Os testes abaixo usaram somente conteúdo fictício, sem medicamentos, doses ou recomendações clínicas.

## Verificado localmente

- Build de produção e TypeScript aprovados. Páginas com sessão são dinâmicas e usam `private, no-store`.
- Oito testes automatizados: datas brasileiras, datas impossíveis, rascunho versus geração, requisitos da prescrição, validação do documento em branco, limites de cadastro, lista pública do service worker e origem da API de PDF.
- Seis PDFs reais: A4 curto (1 página), A4 longo (8), A4 em branco (1), A5 curto (1), A5 longo (15), A5 em branco (1).
- Dimensões físicas: A4 595,28 × 841,89 pt; A5 419,53 × 595,28 pt.
- Acentuação extraível, numeração e assinatura sem sobreposição nos exemplos inspecionados. A geração em branco descarta paciente/documento mesmo se a entrada de teste os contiver. Os metadados são genéricos.
- Fontes Noto incorporadas no conteúdo do documento. O rodapé paginado é aplicado aos bytes ainda não assinados com `pdf-lib`.

## Verificado na Vercel e no Supabase autorizados

### Acesso e persistência

- Entrada e manifest responderam 200. Seis rotas internas sem sessão redirecionaram para entrar.
- APIs de arquivos/PDF sem sessão retornaram 401; origem externa foi recusada com 403. Respostas sensíveis usaram `no-store`.
- Login por formulário real e criação de cookies de sessão.
- Criação do estabelecimento pelo formulário, incluindo associação de responsável e registros iniciais.
- Perfil profissional, paciente e modelo de texto salvos pelos formulários reais.
- Rascunho salvo pela mesma ação autenticada utilizada pelo editor.
- Tentativa de impor `organization_id` pelo cliente não alterou o estabelecimento determinado pelo servidor.
- Rascunho reencontrado no histórico.
- PDF sem confirmação de revisão profissional foi bloqueado.
- Tentativa de sobrescrever uma revisão antiga foi recusada.
- Logout pelo formulário removeu o acesso interno; a API voltou a retornar 401 e o paciente fictício não apareceu na resposta de navegação.

Esses testes usaram requisições HTTP reais aos formulários e às APIs publicados. Eles não equivalem a uma inspeção visual ou interação manual no navegador.

### Uploads e PDFs

- SVG, arquivo acima de 2 MB e conteúdo inválido disfarçado de PNG foram rejeitados.
- Imagem PNG fictícia válida foi reprocessada, armazenada no bucket privado e incorporada ao PDF.
- Logotipo não ficou acessível pelo caminho público do Storage.
- PDFs em branco A4/A5 gerados na Vercel e inspecionados com as dimensões corretas.
- PDF preenchido foi gerado, armazenado e registrado como versão, com snapshot do paciente, conteúdo e identidade.
- Uma correção criou nova versão e manteve a anterior.
- Download anterior permaneceu idêntico byte por byte após alteração do paciente, da identidade e remoção do logotipo atual.
- Snapshot de uma versão incluiu os bytes da imagem utilizada; remover a logo atual não alterou o arquivo histórico.
- Download de versão sem sessão foi recusado.
- Texto fictício longo gerou 4 páginas A4 e 8 páginas A5 na Vercel. A identificação se repetiu e a assinatura foi preservada na última página. Primeira/última página e texto extraído foram conferidos; não houve revisão visual de cada página.
- Os três modelos visuais e as duas combinações tipográficas participaram dos testes de geração.

Foi encontrado e corrigido um problema de empacotamento no Linux da Vercel: `Helvetica.cjs` do PDFKit não entrava no rastreamento automático. A configuração inclui explicitamente fontes padrão e dados do PDFKit, além das fontes Noto.

### Isolamento

O SQL `tests/isolation.sql` foi executado no projeto autorizado com duas contas fictícias e rollback. Confirmou bloqueio de leitura/atualização de pacientes e documentos alheios, inserção em organização alheia, associação cruzada de paciente por FK, escalação de membro, leitura/upload de arquivos alheios e alteração de versões.

A validação HTTP utilizou um espaço fictício isolado. Seus artefatos privados de teste foram mantidos para rastreabilidade, com a conta de teste bloqueada e as sessões revogadas ao término. Credenciais temporárias não foram versionadas nem disponibilizadas como acesso de demonstração.

## Ainda depende de validação operacional

- Cadastro com recebimento e confirmação do e-mail, e recuperação de senha em uma caixa real. A conta HTTP de validação foi criada já confirmada: não prova a entrega de e-mails.
- SMTP próprio e comportamento com e-mails de clientes. Os destinos de confirmação/recuperação foram conferidos; isso não valida o remetente.
- Instalação, atualização, compartilhamento nativo, navegação visual, teclado, contraste e impressão física em aparelhos/navegadores reais. Não foi realizado teste em iPhone ou Android.
- Interação visual completa tipo → paciente → conteúdo → revisão, inserção do modelo e duplicação pelo editor. As ações e a persistência foram testadas por HTTP; a interface não foi inspecionada no navegador porque o controle local estava bloqueado.
- O evento de instalação é capturado na raiz para continuar disponível ao navegar até Configurações. O funcionamento nativo depende do navegador e ainda exige aparelho real.
- Falha de rede durante edição e retorno offline no aparelho. O código não cacheia dados autenticados e só confirma salvamento após resposta do banco, mas não houve simulação manual de perda de conexão no navegador.
- Ativar proteção contra senhas vazadas no Supabase: o advisor ainda retornou esse aviso. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
- Configurar publicação automática a partir de novos pushes no GitHub, se desejado.
- Retenção, exclusão, backups/restauração, termos, privacidade, contratos e revisão profissional/regulatória para operação com dados reais.

A assinatura eletrônica não é integrada. Os arquivos estão identificados como sem assinatura eletrônica. Não se declara certificação LGPD, prontuário certificado ou homologação de gráfica.
