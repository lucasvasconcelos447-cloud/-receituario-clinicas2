# Estado de validação

## Verificado

- TypeScript: passou após os ajustes do editor e geração de versões.
- Build final de produção: concluiu com sucesso (Next.js 16.4.3, Webpack). Páginas com sessão são dinâmicas e sem cache.
- 8 testes automatizados passaram (incluindo origem da API de PDF): datas, datas impossíveis, rascunho versus geração, campos de prescrição, documento em branco, limites de dados e lista pública do service worker.
- SQL de isolamento executado no projeto autorizado, em transação com rollback: conta B sem leitura/atualização dos pacientes/documentos da A; inserção em organização alheia bloqueada; vínculo cruzado de paciente bloqueado por FK; escalação de membro bloqueada; leitura e upload de arquivos alheios bloqueados; alteração de versões bloqueada por privilégios. Arquivo reproduzível: `tests/isolation.sql`.
- Seis PDFs reais gerados: A4 curto (1 página), A4 longo (8), A4 em branco (1), A5 curto (1), A5 longo (15), A5 em branco (1).
- MediaBox dos PDFs: A4 595,28 × 841,89 pt; A5 419,53 × 595,28 pt.
- Inspeção visual após correções: A5 em branco, A4 preenchido e última página do texto longo A5. Rodapé, paginação e assinatura visíveis. Todas as seis exportações passaram no script de dimensões, acentuação e ausência de identificadores do paciente no arquivo em branco. Não houve revisão visual de cada página dos documentos longos.
- Fontes locais Noto e texto vetorial. Exemplos incluem acentuação brasileira.
- Advisor Supabase: proteção contra senhas vazadas desativada; ajuste operacional pendente.

## Ainda não verificado de ponta a ponta

O servidor de produção local respondeu aos testes HTTP. Entrada e manifest retornaram 200; seis rotas protegidas redirecionaram para entrar; APIs sem sessão retornaram 401, origem externa retornou 403 e a entrada usou no-store. O navegador embutido informou que o uso de navegador local está desativado nas configurações do Work, impedindo inspeção da interface e a jornada autenticada completa.

- Cadastro/login/recuperação recebendo e-mail e sessões reais no navegador.
- Jornada conta → perfil → logo → paciente → rascunho → PDF → histórico pela interface.
- Upload inválido/grande e falha de rede pela interface (há validação implementada, sem teste integrado concluído).
- Logout/troca de conta e navegação de retorno no navegador.
- Preservação de PDF após alteração de identidade pela jornada completa.
- Compartilhamento nativo e download em navegadores reais.
- Instalação/atualização PWA no iPhone e Android; impressão física.
- Prévia/publicação Vercel e configuração final de callbacks de autenticação.

Somente dados fictícios foram usados nas validações. Não considerar esta versão homologada para dados reais antes da conclusão das verificações pendentes.
