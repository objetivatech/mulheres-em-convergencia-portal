import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';

export default function PoliticaDePrivacidade() {
  return (
    <Layout>
      <Helmet>
        <title>Política de Privacidade - Mulheres em Convergência</title>
        <meta name="description" content="Política de privacidade e proteção de dados pessoais conforme LGPD." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Política de Privacidade</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. Introdução</h2>
            <p>
              A <strong>ESCOLA DE NEGOCIOS MULHERES EM CONVERGENCIA LTDA</strong> ("Mulheres em Convergência", "nós" ou "nossa"), 
              inscrita no CNPJ nº 28.574.909/0001-72, está comprometida com a proteção da privacidade e dos dados pessoais 
              de seus usuários ("você" ou "usuário").
            </p>
            <p>
              Esta Política de Privacidade foi elaborada em conformidade com a <strong>Lei Geral de Proteção de Dados 
              (LGPD - Lei nº 13.709/2018)</strong> e descreve como coletamos, usamos, armazenamos, compartilhamos e 
              protegemos suas informações pessoais.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">2. Dados Pessoais Coletados</h2>
            <p>
              Coletamos diferentes tipos de dados pessoais dependendo da sua interação com nossa Plataforma:
            </p>
            
            <h3 className="text-xl font-semibold mt-6">2.1. Dados Fornecidos Diretamente por Você</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Cadastro de Conta:</strong> nome completo, e-mail, CPF, telefone, data de nascimento</li>
              <li><strong>Perfil de Negócio:</strong> nome da empresa, CNPJ, endereço comercial, categoria de atuação, 
              descrição do negócio, logo, imagens</li>
              <li><strong>Pagamentos:</strong> dados de faturamento e histórico de transações (processados por terceiros seguros)</li>
              <li><strong>Contato:</strong> mensagens enviadas através de formulários de contato</li>
              <li><strong>Conteúdo Gerado:</strong> avaliações, comentários, publicações no blog</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">2.2. Dados Coletados Automaticamente</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Navegação:</strong> endereço IP, tipo de navegador, sistema operacional, 
              páginas visitadas, tempo de permanência</li>
              <li><strong>Cookies:</strong> identificadores únicos, preferências do usuário (veja nossa 
              <a href="/politica-de-cookies" className="text-primary hover:underline"> Política de Cookies</a>)</li>
              <li><strong>Dados de Dispositivo:</strong> modelo, resolução de tela, idioma</li>
              <li><strong>Geolocalização:</strong> localização aproximada baseada em IP</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">2.3. Dados Sensíveis</h3>
            <p>
              Não coletamos intencionalmente dados sensíveis (origem racial, convicções religiosas, opiniões políticas, 
              dados de saúde, etc.), exceto quando estritamente necessário e com seu consentimento explícito.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">3. Finalidades do Tratamento de Dados</h2>
            <p>
              Utilizamos seus dados pessoais para as seguintes finalidades, conforme as bases legais da LGPD:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Prestação de Serviços (Art. 7º, V):</strong> criar e gerenciar sua conta, 
              fornecer acesso ao diretório de negócios, processar pagamentos</li>
              <li><strong>Execução de Contrato (Art. 7º, V):</strong> cumprir obrigações decorrentes 
              de planos de assinatura</li>
              <li><strong>Legítimo Interesse (Art. 7º, IX):</strong> melhorar nossos serviços, 
              realizar análises estatísticas, prevenir fraudes</li>
              <li><strong>Consentimento (Art. 7º, I):</strong> enviar newsletters e comunicações de marketing 
              (você pode cancelar a qualquer momento)</li>
              <li><strong>Obrigação Legal (Art. 7º, II):</strong> cumprir exigências legais e regulatórias, 
              como emissão de notas fiscais</li>
              <li><strong>Exercício de Direitos (Art. 7º, VI):</strong> defender direitos em processos 
              judiciais ou administrativos</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">4. Compartilhamento de Dados</h2>
            <p>
              Seus dados pessoais podem ser compartilhados nas seguintes situações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provedores de Serviços:</strong> empresas que nos auxiliam em hospedagem, 
              processamento de pagamentos, análise de dados (Supabase, Stripe, Google Analytics)</li>
              <li><strong>Parceiros Comerciais:</strong> mediante seu consentimento explícito</li>
              <li><strong>Autoridades Públicas:</strong> quando exigido por lei ou ordem judicial</li>
              <li><strong>Transferências Corporativas:</strong> em caso de fusão, aquisição ou venda de ativos</li>
            </ul>
            <p>
              <strong>Importante:</strong> Não vendemos, alugamos ou comercializamos seus dados pessoais 
              para terceiros para fins de marketing sem seu consentimento.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">5. Armazenamento e Segurança dos Dados</h2>
            
            <h3 className="text-xl font-semibold mt-6">5.1. Prazo de Armazenamento</h3>
            <p>
              Armazenamos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas 
              nesta Política, respeitando prazos legais mínimos:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dados de Cadastro:</strong> enquanto sua conta estiver ativa + 5 anos (prescrição legal)</li>
              <li><strong>Dados Fiscais:</strong> 5 anos após a última transação (CTN - Código Tributário Nacional)</li>
              <li><strong>Logs de Acesso:</strong> 6 meses (Marco Civil da Internet - Lei 12.965/2014)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">5.2. Medidas de Segurança</h3>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acessos não autorizados, 
              perda, alteração ou divulgação:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Criptografia de dados em trânsito (SSL/TLS) e em repouso</li>
              <li>Controles de acesso baseados em funções (RBAC)</li>
              <li>Autenticação de dois fatores (quando disponível)</li>
              <li>Monitoramento e auditoria de segurança</li>
              <li>Backups regulares e redundância de dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">6. Seus Direitos como Titular de Dados (Art. 18 da LGPD)</h2>
            <p>
              De acordo com a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Confirmação e Acesso:</strong> confirmar se tratamos seus dados e acessá-los</li>
              <li><strong>Correção:</strong> solicitar correção de dados incompletos, inexatos ou desatualizados</li>
              <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> de dados desnecessários, excessivos ou 
              tratados em desconformidade</li>
              <li><strong>Portabilidade:</strong> solicitar a transferência de seus dados para outro fornecedor</li>
              <li><strong>Eliminação:</strong> excluir dados tratados com base em consentimento</li>
              <li><strong>Informação sobre Compartilhamento:</strong> saber com quem compartilhamos seus dados</li>
              <li><strong>Revogação do Consentimento:</strong> retirar consentimento a qualquer momento</li>
              <li><strong>Oposição ao Tratamento:</strong> opor-se a tratamentos realizados sem consentimento</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato pelo e-mail: 
              <strong> mulheresemconvergencia@gmail.com</strong>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">7. Cookies e Tecnologias Semelhantes</h2>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar sua experiência na Plataforma. 
              Para informações detalhadas, consulte nossa 
              <a href="/politica-de-cookies" className="text-primary hover:underline"> Política de Cookies</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">8. Transferência Internacional de Dados</h2>
            <p>
              Alguns de nossos provedores de serviços podem estar localizados fora do Brasil. 
              Nestes casos, garantimos que sejam aplicadas medidas de proteção adequadas, como cláusulas 
              contratuais padrão e certificações de conformidade com a LGPD.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">9. Privacidade de Menores de Idade</h2>
            <p>
              Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente 
              dados pessoais de menores sem o consentimento dos pais ou responsáveis legais. 
              Se tomarmos conhecimento de coleta inadvertida, tomaremos medidas para excluir esses dados.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">10. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade periodicamente para refletir mudanças em 
              nossas práticas ou na legislação. Notificaremos sobre alterações significativas por e-mail 
              ou aviso destacado na Plataforma. A versão atualizada sempre estará disponível nesta página 
              com a data da última modificação.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">11. Encarregado de Proteção de Dados (DPO)</h2>
            <p>
              Designamos um Encarregado de Proteção de Dados (Data Protection Officer - DPO) para atuar 
              como canal de comunicação entre você, a empresa e a Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
            <p>
              <strong>Contato do DPO:</strong> mulheresemconvergencia@gmail.com<br />
              <strong>Assunto:</strong> "LGPD - Dados Pessoais"
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">12. Autoridade Nacional de Proteção de Dados (ANPD)</h2>
            <p>
              Se você entender que seus direitos não foram adequadamente respeitados, pode apresentar 
              reclamação à ANPD:
            </p>
            <p>
              <strong>Site:</strong> <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">www.gov.br/anpd</a><br />
              <strong>Ouvidoria:</strong> 0800 892 3003
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">13. Contato</h2>
            <p>
              Para dúvidas, solicitações ou exercício de direitos relacionados a esta Política de Privacidade:
            </p>
            <p>
              <strong>ESCOLA DE NEGOCIOS MULHERES EM CONVERGENCIA LTDA</strong><br />
              <strong>CNPJ:</strong> 28.574.909/0001-72<br />
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
