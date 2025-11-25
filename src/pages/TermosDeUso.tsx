import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';

export default function TermosDeUso() {
  return (
    <Layout>
      <Helmet>
        <title>Termos de Uso - Mulheres em Convergência</title>
        <meta name="description" content="Termos e condições de uso do portal Mulheres em Convergência." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Termos de Uso</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. Informações da Empresa</h2>
            <p>
              Este site é operado pela <strong>ESCOLA DE NEGOCIOS MULHERES EM CONVERGENCIA LTDA</strong>, 
              pessoa jurídica de direito privado inscrita no CNPJ sob nº <strong>28.574.909/0001-72</strong>, 
              com sede na Rua Águias, nº 85, Casa, Jardim Algarve, Alvorada/RS, CEP 94.858-570.
            </p>
            <p>
              <strong>E-mail:</strong> mulheresemconvergencia@gmail.com<br />
              <strong>Telefone:</strong> (51) 9236-6002
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">2. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar o portal Mulheres em Convergência ("Plataforma"), você ("Usuário") 
              concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. 
              Se você não concordar com algum destes termos, está proibido de usar ou acessar esta Plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">3. Descrição dos Serviços</h2>
            <p>
              A Plataforma oferece os seguintes serviços:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Diretório de negócios liderados por mulheres</li>
              <li>Blog com conteúdo educacional e inspiracional</li>
              <li>Planos de assinatura para destaque de negócios</li>
              <li>Ferramentas de rede e conexão entre empreendedoras</li>
              <li>Conteúdos sobre empreendedorismo feminino e desenvolvimento profissional</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">4. Cadastro e Conta de Usuário</h2>
            <p>
              Para acessar determinadas funcionalidades, é necessário criar uma conta fornecendo 
              informações verdadeiras, completas e atualizadas. Você é responsável por:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Manter a confidencialidade de suas credenciais de acesso</li>
              <li>Todas as atividades realizadas em sua conta</li>
              <li>Notificar imediatamente sobre qualquer uso não autorizado</li>
              <li>Garantir que possui capacidade legal para contratar</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">5. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo presente na Plataforma, incluindo textos, gráficos, logotipos, ícones, 
              imagens, áudios, vídeos, downloads e softwares, é de propriedade exclusiva da 
              Mulheres em Convergência ou de seus licenciadores e está protegido pelas leis de 
              propriedade intelectual brasileiras e internacionais.
            </p>
            <p>
              É proibido reproduzir, distribuir, modificar ou criar obras derivadas sem autorização 
              expressa por escrito.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">6. Conduta do Usuário</h2>
            <p>
              Ao utilizar a Plataforma, você concorda em NÃO:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violar qualquer lei ou regulamento aplicável</li>
              <li>Publicar conteúdo ofensivo, discriminatório, difamatório ou ilegal</li>
              <li>Utilizar a Plataforma para fins fraudulentos ou enganosos</li>
              <li>Interferir ou comprometer a segurança da Plataforma</li>
              <li>Coletar dados de outros usuários sem consentimento</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso</li>
              <li>Fazer spam ou distribuir publicidade não autorizada</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">7. Planos e Pagamentos</h2>
            <p>
              Os planos de assinatura estão sujeitos aos valores e condições especificados na 
              página de Planos. Os pagamentos são processados por meio de plataformas seguras de terceiros.
            </p>
            <p>
              <strong>Renovação:</strong> As assinaturas são renovadas automaticamente, 
              salvo cancelamento prévio pelo Usuário.<br />
              <strong>Reembolso:</strong> Não são oferecidos reembolsos para serviços já prestados, 
              exceto nos casos previstos em lei (Código de Defesa do Consumidor - Lei 8.078/90).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">8. Privacidade e Proteção de Dados</h2>
            <p>
              O tratamento de dados pessoais realizado pela Plataforma está detalhado em nossa 
              <a href="/politica-de-privacidade" className="text-primary hover:underline"> Política de Privacidade</a>, 
              elaborada em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">9. Isenção de Garantias</h2>
            <p>
              A Plataforma é fornecida "no estado em que se encontra" e "conforme disponível". 
              Não garantimos que:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>O serviço será ininterrupto, seguro ou livre de erros</li>
              <li>Os resultados obtidos serão precisos ou confiáveis</li>
              <li>Defeitos serão corrigidos em prazos específicos</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">10. Limitação de Responsabilidade</h2>
            <p>
              Em nenhuma circunstância a Mulheres em Convergência será responsável por danos diretos, 
              indiretos, incidentais, especiais ou consequenciais resultantes do uso ou incapacidade 
              de usar a Plataforma, incluindo perda de dados, lucros cessantes ou interrupção de negócios.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">11. Modificações dos Termos</h2>
            <p>
              Reservamos o direito de modificar estes Termos de Uso a qualquer momento. 
              As alterações entrarão em vigor imediatamente após a publicação na Plataforma. 
              O uso continuado após modificações constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">12. Rescisão</h2>
            <p>
              Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, 
              em caso de violação destes Termos de Uso. Você também pode encerrar sua conta 
              a qualquer momento através das configurações da Plataforma.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">13. Lei Aplicável e Foro</h2>
            <p>
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
              Fica eleito o foro da comarca de Alvorada/RS para dirimir quaisquer controvérsias 
              decorrentes destes termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">14. Contato</h2>
            <p>
              Para dúvidas, sugestões ou solicitações relacionadas a estes Termos de Uso, 
              entre em contato conosco:
            </p>
            <p>
              <strong>E-mail:</strong> mulheresemconvergencia@gmail.com<br />
              <strong>Telefone:</strong> (51) 9236-6002<br />
              <strong>Endereço:</strong> Rua Águias, nº 85, Casa, Jardim Algarve, Alvorada/RS, CEP 94.858-570
            </p>
          </section>
        </div>
      </article>
    </Layout>
  );
}
