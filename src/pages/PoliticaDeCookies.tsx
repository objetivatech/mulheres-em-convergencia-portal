import React from 'react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/layout/Layout';

export default function PoliticaDeCookies() {
  return (
    <Layout>
      <Helmet>
        <title>Política de Cookies - Mulheres em Convergência</title>
        <meta name="description" content="Política de uso de cookies e tecnologias de rastreamento." />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Política de Cookies</h1>
        
        <div className="prose prose-lg max-w-none space-y-6 text-foreground">
          <p className="text-muted-foreground">
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">1. O que são Cookies?</h2>
            <p>
              Cookies são pequenos arquivos de texto armazenados no seu dispositivo (computador, smartphone, tablet) 
              quando você visita um site. Eles permitem que o site "lembre" de suas ações e preferências 
              (como login, idioma, tamanho de fonte e outras preferências de exibição) por um período de tempo, 
              para que você não precise reinseri-las sempre que retornar ao site ou navegar entre páginas.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">2. Por que Utilizamos Cookies?</h2>
            <p>
              A <strong>ESCOLA DE NEGOCIOS MULHERES EM CONVERGENCIA LTDA</strong> utiliza cookies para:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Funcionamento Essencial:</strong> garantir que o site funcione corretamente 
              (autenticação, segurança, carregamento de páginas)</li>
              <li><strong>Desempenho:</strong> analisar como os visitantes usam o site para melhorar a experiência</li>
              <li><strong>Funcionalidade:</strong> lembrar suas preferências e configurações</li>
              <li><strong>Marketing:</strong> personalizar conteúdo e anúncios relevantes (com seu consentimento)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">3. Tipos de Cookies que Utilizamos</h2>
            
            <h3 className="text-xl font-semibold mt-6">3.1. Cookies Estritamente Necessários</h3>
            <p>
              São essenciais para o funcionamento do site e não podem ser desativados. 
              Sem eles, serviços básicos como login e carrinho de compras não funcionariam.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Finalidade</th>
                    <th className="text-left py-2">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2">sb-access-token</td>
                    <td className="py-2">Autenticação de usuário</td>
                    <td className="py-2">Sessão</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">sb-refresh-token</td>
                    <td className="py-2">Renovação de sessão</td>
                    <td className="py-2">30 dias</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">cookie_consent</td>
                    <td className="py-2">Armazenar preferências de cookies</td>
                    <td className="py-2">1 ano</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6">3.2. Cookies de Desempenho e Análise</h3>
            <p>
              Coletam informações sobre como os visitantes usam o site (páginas mais visitadas, 
              tempo de permanência, erros). Esses dados são agregados e anônimos.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Provedor</th>
                    <th className="text-left py-2">Finalidade</th>
                    <th className="text-left py-2">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2">_ga</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Distinguir usuários</td>
                    <td className="py-2">2 anos</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">_gid</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Distinguir usuários</td>
                    <td className="py-2">24 horas</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">_gat</td>
                    <td className="py-2">Google Analytics</td>
                    <td className="py-2">Limitar taxa de requisições</td>
                    <td className="py-2">1 minuto</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6">3.3. Cookies de Funcionalidade</h3>
            <p>
              Permitem que o site lembre de escolhas que você faz (como nome de usuário, idioma, região) 
              para fornecer recursos mais personalizados.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Finalidade</th>
                    <th className="text-left py-2">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2">theme</td>
                    <td className="py-2">Armazenar preferência de tema (claro/escuro)</td>
                    <td className="py-2">1 ano</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">user_location</td>
                    <td className="py-2">Armazenar localização preferida</td>
                    <td className="py-2">30 dias</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold mt-6">3.4. Cookies de Publicidade e Marketing</h3>
            <p>
              Utilizados para rastrear visitantes entre sites e exibir anúncios relevantes. 
              <strong> Estes cookies só são ativados com seu consentimento explícito.</strong>
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Cookie</th>
                    <th className="text-left py-2">Provedor</th>
                    <th className="text-left py-2">Finalidade</th>
                    <th className="text-left py-2">Duração</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td className="py-2">_fbp</td>
                    <td className="py-2">Meta (Facebook)</td>
                    <td className="py-2">Rastreamento de conversões</td>
                    <td className="py-2">3 meses</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2">IDE</td>
                    <td className="py-2">Google</td>
                    <td className="py-2">Publicidade direcionada</td>
                    <td className="py-2">1 ano</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">4. Cookies de Terceiros</h2>
            <p>
              Além dos nossos próprios cookies, também utilizamos serviços de terceiros que podem definir cookies:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics:</strong> análise de tráfego e comportamento 
              (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Política de Privacidade</a>)</li>
              <li><strong>Supabase:</strong> autenticação e banco de dados 
              (<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Política de Privacidade</a>)</li>
              <li><strong>Stripe:</strong> processamento de pagamentos 
              (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Política de Privacidade</a>)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">5. Como Gerenciar Cookies</h2>
            <p>
              Você tem controle total sobre os cookies e pode gerenciá-los de várias formas:
            </p>

            <h3 className="text-xl font-semibold mt-6">5.1. Banner de Consentimento</h3>
            <p>
              Ao acessar nosso site pela primeira vez, você verá um banner solicitando consentimento para cookies. 
              Você pode aceitar todos, recusar cookies opcionais ou personalizar suas preferências.
            </p>

            <h3 className="text-xl font-semibold mt-6">5.2. Configurações do Navegador</h3>
            <p>
              A maioria dos navegadores permite gerenciar cookies através das configurações:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
              <li><strong>Mozilla Firefox:</strong> Opções → Privacidade e Segurança → Cookies</li>
              <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
              <li><strong>Microsoft Edge:</strong> Configurações → Privacidade → Cookies</li>
            </ul>
            <p>
              <strong>Atenção:</strong> Desativar cookies necessários pode afetar a funcionalidade do site.
            </p>

            <h3 className="text-xl font-semibold mt-6">5.3. Ferramentas de Opt-Out</h3>
            <p>
              Você pode desativar cookies de publicidade através de:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Digital Advertising Alliance (DAA)</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Your Online Choices (EDAA)</a></li>
              <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Google Analytics Opt-out</a></li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">6. Web Beacons e Pixels de Rastreamento</h2>
            <p>
              Além de cookies, utilizamos web beacons (pequenas imagens invisíveis) e pixels de rastreamento 
              para monitorar o comportamento do usuário, medir a eficácia de campanhas de e-mail e analisar 
              o uso do site. Essas tecnologias funcionam em conjunto com cookies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">7. Conformidade com a LGPD</h2>
            <p>
              O uso de cookies está em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)</strong>:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Obtemos consentimento explícito para cookies não essenciais</li>
              <li>Fornecemos informações claras sobre o uso de cookies</li>
              <li>Permitimos que você gerencie suas preferências a qualquer momento</li>
              <li>Respeitamos seus direitos de titular de dados</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">8. Atualização desta Política</h2>
            <p>
              Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em nossas práticas 
              ou na legislação. A versão atualizada será publicada nesta página com a data de modificação. 
              Recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">9. Contato</h2>
            <p>
              Para dúvidas sobre cookies ou para exercer seus direitos de privacidade:
            </p>
            <p>
              <strong>ESCOLA DE NEGOCIOS MULHERES EM CONVERGENCIA LTDA</strong><br />
              <strong>CNPJ:</strong> 28.574.909/0001-72<br />
              <strong>E-mail:</strong> mulheresemconvergencia@gmail.com<br />
              <strong>Telefone:</strong> (51) 9236-6002<br />
              <strong>Endereço:</strong> Rua Águias, nº 85, Casa, Jardim Algarve, Alvorada/RS, CEP 94.858-570
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold mt-8">10. Links Úteis</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><a href="/politica-de-privacidade" className="text-primary hover:underline">Política de Privacidade</a></li>
              <li><a href="/termos-de-uso" className="text-primary hover:underline">Termos de Uso</a></li>
              <li><a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" 
              className="text-primary hover:underline">Autoridade Nacional de Proteção de Dados (ANPD)</a></li>
            </ul>
          </section>
        </div>
      </article>
    </Layout>
  );
}
