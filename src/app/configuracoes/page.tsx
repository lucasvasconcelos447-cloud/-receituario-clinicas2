import { context } from "@/lib/context";
import { Shell } from "@/components/shell";
import { InstallButton } from "@/components/pwa";
export default async function Settings() {
  const { organization, user } = await context();
  return (
    <Shell name={organization.name} active="/configuracoes">
      <span className="eyebrow">DO SEU JEITO</span>
      <h1>Configurações e instalação</h1>
      <section className="card">
        <h2>Seu espaço, na tela inicial</h2>
        <p>Acesse o Receituário como um aplicativo no celular ou computador.</p>
        <InstallButton />
      </section>
      <section className="card">
        <h2>Conta e privacidade</h2>
        <p>Conectado como {user.email}</p>
        <a href="/entrar">Recuperar acesso ou alterar senha</a>
        <p>
          Dados clínicos não são disponibilizados para uso offline. Não
          compartilhe seu acesso. Cada estabelecimento possui seus próprios
          pacientes, arquivos e documentos.
        </p>
        <p>
          Antes da operação com dados reais, o responsável precisa definir
          retenção, exclusão, política de privacidade e contratos com
          fornecedores. Esta versão não representa certificação LGPD ou
          prontuário certificado.
        </p>
      </section>
      <section className="card">
        <h2>Assinatura de documentos</h2>
        <p>
          Os PDFs são gerados sem assinatura eletrônica. Baixe o arquivo e envie
          ao serviço de assinatura escolhido. Depois, baixe o resultado nesse
          serviço.
        </p>
        <a
          className="button secondary"
          href="https://assinador.iti.br/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir assinador oficial gov.br ↗
        </a>
        <p>
          Nenhum envio automático é realizado. Não informe suas credenciais
          gov.br neste aplicativo.
        </p>
      </section>
    </Shell>
  );
}
