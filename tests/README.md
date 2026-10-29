# Testes e operação local

Os arquivos em `tests/fixture.ts` são fictícios e não são inseridos na produção. Para inspecionar PDFs reais de teste:

```sh
npx tsx scripts/pdf-qa.ts
python scripts/verify_pdf.py
```

A conferência Python requer `pypdf` e `pypdfium2`. Os PDFs e PNGs são criados em `work/pdf-qa`, ignorado pelo Git. O teste em branco mantém propositalmente um paciente fictício na entrada e confirma que o exportador o elimina.

Com o aplicativo aberto em uma segunda janela:

```sh
npm start -- --port 3020
```

Em outro terminal, configure `TEST_APP_URL=http://127.0.0.1:3020` e execute:

```sh
node tests/http-smoke.mjs
```

O teste de isolamento `tests/isolation.sql` exige uma conexão administrativa de um projeto de teste. Ele abre uma transação, cria duas contas fictícias, passa a operar como `authenticated`, verifica as restrições e executa rollback. Não contém credenciais.
