import jsPDF from "jspdf";

interface TechnicalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const sections: TechnicalSection[] = [
  {
    title: "1. Visão geral do produto",
    paragraphs: [
      "O FluxoComanda é uma aplicação web progressiva para gestão de comandas, vendas, caixa, clientes, produtos e relatórios de pequenos negócios. O produto foi conceived para funcionar em dispositivos móveis, offering a fluid experience of a native application while maintaining the convenience of access through a browser.",
      "A plataforma cobre o ciclo principal de uma venda: cadastro de produtos e clientes, abertura de comanda, inclusão de itens, fechamento com forma de pagamento, registro automático no caixa e consolidação dos indicadores em relatórios. A arquitetura também contempla perfis administrativos, operação de garis, assinatura, administração central e instalação no dispositivo.",
      "A proposta central é reduzir a burocracia operacional e fornecer, em um único ambiente, dados confiáveis para decisão, fechamento de expediente e acompanhamento de desempenho."
    ],
    bullets: [
      "Interface responsiva para desktop, tablet e celular.",
      "Persistência de dados em Supabase/PostgreSQL.",
      "Autenticação e autorização por usuário e perfil.",
      "Geração local de relatórios PDF.",
      "Estrutura preparada para evolução como PWA."
    ]
  },
  {
    title: "2. Objetivo técnico e escopo",
    paragraphs: [
      "O objetivo da solução é oferecer uma plataforma segura, rastreável e fácil de utilizar para controle de comandas, mantendo uma separação clara entre responsabilidades de interface, acesso a dados, regras de negócio e apresentação de relatórios.",
      "O escopo funcional cobre: autenticação, cadastro de negócio, gestão de produtos, cadastro de clientes, comandas abertas, guardadas e fechadas, itens da comanda, vendas, caixa, fechamentos de expediente, relatórios, assinaturas, administração de usuários e suporte ao cliente."
    ],
    bullets: [
      "Fluxo de vendas: comanda aberta, itens adicionados, total calculado e fechamento confirmado.",
      "Fluxo financeiro: vendas fechadas alimentam o caixa e os relatórios consolidados.",
      "Fluxo de acesso: gestores administram o negócio e garisIES liability operation.",
      "Fluxo de assinatura: trial, planos pagos, vencimento e renovação."
    ]
  },
  {
    title: "3. Stack technological e arquitetura",
    paragraphs: [
      "A aplicação utiliza React com TypeScript sobre Vite, formando uma SPA modular. O roteamento é feito com React Router, enquanto o TanStack Query centraliza o gerenciamento de estado remoto e a infraestrutura de requisições. A camada visual é construída com Tailwind CSS e componentes acessíveis baseados no padrão shadcn/ui.",
      "O Supabase fornece autenticação, PostgreSQL e políticas de segurança ao nível de linha. O SDK oficial do Supabase é usado diretamente no frontend por meio de um cliente centralizado. Componentes de interface, hooks de domínio, páginas e integrações são mantidos em pastas separadas para reduzir acoplamento.",
      "O frontend não contém regras de autorização independentes. O banco aplica RLS como uma camada adicional de isolamento, e as policies verificam o usuário autenticado e o vínculo do registro com a empresa ou proprietário correspondente."
    ],
    bullets: [
      "Frontend: React 18, TypeScript, Vite e React Router.",
      "Estilos: Tailwind CSS, CSS variables e componentes shadcn/ui.",
      "Estado remoto: TanStack Query.",
      "Backend: Supabase Auth, PostgreSQL e Row Level Security.",
      "Documentos: jsPDF e jspdf-autotable.",
      "Testes: Vitest, Testing Library e jsdom.",
      "Qualidade: ESLint, TypeScript e validação de build por Vite."
    ]
  },
  {
    title: "4. Organização do código-fonte",
    paragraphs: [
      "A organização do código segue uma divisão entre infraestrutura, domínio e apresentação. Componentes em src/components são reutilizáveis e não devem consultar o banco diretamente. Hooks em src/hooks encapsulam autenticação, perfil, negócio e assinatura. Páginas em src/pages representam fluxos completos e compõem os componentes utilizados.",
      "A integração com o Supabase possui um módulo único em src/integrations/supabase/client.ts. Tipos manuais do banco estão em database.types.ts e devem ser mantidos alinhados ao schema. Utilitários de apresentação ficam em src/lib, enquanto integrações específicas de PDF podem ser executadas no cliente sem expor dados a serviços externos."
    ],
    bullets: [
      "src/pages: telas e fluxos de navegação.",
      "src/components: componentes visuais e componentes de domínio.",
      "src/hooks: hooks de contexto e regras de acesso aos providers.",
      "src/lib: funções compartilhadas, geração de PDF e configurações.",
      "src/integrations/supabase: cliente, tipos e contrato do banco.",
      "src/test: ambiente de testes automatizados.",
      "supabase/migrations: alterações incrementais e versionadas do PostgreSQL."
    ]
  },
  {
    title: "5. Modelo de dados",
    paragraphs: [
      "O banco utiliza uma modelagem relacional orientada ao negócio. profiles representa a identidade e a configuração do usuário, incluindo o papel, a empresa, a assinatura e a marca. products armazena o catálogo comercial e sua categoria. orders registra comandas e seu ciclo de vida. order_items representa os produtos incluídos em cada comanda.",
      "customers mantém a base de clientes com nome, apelido e WhatsApp. sales representa a venda concluída e é a origem dos valores usados pelo caixa e pelos relatórios. cash_closures registra fechamentos manuais ou automáticos por dia e forma de pagamento. subscriptions mantém os dados do plano comercial e do período de validade."
    ],
    bullets: [
      "profiles: identidade, papel, negócio, marca e assinatura.",
      "products: nome, preço, custo, categoria e estado ativo.",
      "orders: cliente, total, status, pagamento e datas do ciclo.",
      "order_items: produto, quantidade, preço unitário e subtotal.",
      "customers: identificação e canal de contato.",
      "sales: vendas concluídas para consolidação financeira.",
      "cash_closures: totais consolidados e quantidade de vendas.",
      "subscriptions: plano, trial, vencimento e estado do acesso."
    ]
  },
  {
    title: "6. Ciclo de vida da comanda",
    paragraphs: [
      "A comanda inicia em estado aberto. Nessa fase, itens podem ser incluídos, ajustados ou removidos. O cálculo do subtotal deve ser realizado a partir da quantidade multiplicada pelo preço unitário, preservando o valor cobrado no momento do lançamento. A interface oferece abertura por nome do cliente, apelido ou número da mesa.",
      "A comanda guardada é uma opção intermediária para registrar um pedido que ainda não será faturado. Ela permanece fora das vendas e dos totais financial. No fechamento, o usuário seleciona dinheiro, Pix ou cartão, confirma a operação e o sistema registra a venda. A comanda fechada passa a compor o caixa e os relatórios do período correspondente."
    ],
    bullets: [
      "Consulta de clientes cadastrados durante a abertura.",
      "Seleção de produtos por busca ou categoria.",
      "Controle de quantidade e remoção de itens.",
      "Cálculo do total antes da confirmação.",
      "Fechamento com registro de forma de pagamento.",
      "Atualização dos indicadores após a venda."
    ]
  },
  {
    title: "7. Segurança e controle de acesso",
    paragraphs: [
      "A segurança combina autenticação do Supabase, sessões no navegador, perfis de aplicação e políticas RLS no PostgreSQL. O frontend oculta ações que o usuário não pode executar, mas a proteção decisiva permanece no banco. Cada consulta deve incluir o filtro de escopo necessário, e as policies devem impedir o acesso a registros de outro negócio.",
      "Os papéis previstos são admin, superadmin e garcom. Administradores gerenciam produtos, clientes, caixa, relatórios e configuração do negócio. Garçons operates the operational flow of orders and closing. Superadministradores administram customers of the system, subscriptions and access control. O frontend não deve exibir dados de gestão a garisIES.",
      "Chaves de serviço, credenciais administrativas e segredos de integração nunca devem ser enviados ao navegador. Alterações estruturais no banco devem ser executadas por novas migrations, preservando o histórico aplicado."
    ],
    bullets: [
      "RLS habilitado nas tabelas que possuem dados operacionais.",
      "Policies baseadas em auth.uid() e owner_id.",
      "Separação de rotas públicas, autenticadas e restritas.",
      "Validação de entrada no cliente e restrições no banco.",
      "Revisão de índices e policies em toda alteração relevante.",
      "Nunca registrar ou exibir segredos em logs."
    ]
  },
  {
    title: "8. Caixa e relatórios",
    paragraphs: [
      "O caixa consolida as vendas concluídas no dia, separando os valores por dinheiro, Pix e cartão. O fechamento de expediente cria um registro com o total geral, os totais por meio de pagamento, a quantidade de vendas e a data de negócio. Esse registro permite preservar o histórico mesmo quando os dados da venda mudam posteriormente.",
      "Os relatórios apresentam vendas por dia, comparações semanais e mensais e uma visão anual. Os filtros de período devem ser aplicados no conjunto de dados antes da agregação. A geração de PDF utiliza jsPDF e jspdf-autotable para manter títulos, cabeçalhos, linhas alternadas, paginação e rodapé consistentes."
    ],
    bullets: [
      "Indicador de vendas totais do período.",
      "Quantidade de vendas e ticket médio.",
      "Separação por forma de pagamento.",
      "Fechamento manual com histórico auditável.",
      "Exportação PDF para impressão ou compartilhamento."
    ]
  },
  {
    title: "9. Fluxos de usuário e navegação",
    paragraphs: [
      "Após autenticação, o usuário é direcionado ao dashboard de acordo com o perfil. O dashboard apresenta vendas do dia, comandas abertas, comandas fechadas e ticket médio, além de atalhos para abertura de comandas. A navegação inferior oferece acesso às áreas principais da aplicação.",
      "Gestores possuem acesso a produtos, clientes, caixa, relatórios, negócio e assinatura. Garçons possuem acesso às comandas e às ações permitidas dentro de cada comanda. O painel administrativo e a página de status são protegidos por condições específicas de perfil."
    ],
    bullets: [
      "Login, recuperação de senha e redirecionamento por perfil.",
      "Dashboard com indicadores calculados a partir das vendas.",
      "Gestão de comandas com filtros por estado.",
      "Telas administrativas protegidas por rota.",
      "Estados de carregamento para evitar saltos de layout."
    ]
  },
  {
    title: "10. Validação, testes e qualidade",
    paragraphs: [
      "A estratégia de qualidade combina verificação estática, testes unitários, testes de componentes e validação do bundle de produção. O TypeScript deve permanecer sem erros, o ESLint deve apontar problemas reais de código e o build do Vite deve ser executado antes de cada publicação.",
      "Os testes devem priorizar cálculos financeiros, regras de status, transformação de dados e componentes com interação relevante. Consultas ao Supabase devem ser testadas por meio de mocks ou de um ambiente de integração controlado. A migração do banco deve ser validada em ambiente de homologação antes de alcançar o ambiente de produção."
    ],
    bullets: [
      "Testes unitários para utilitários e cálculos.",
      "Testes de interação para formulários e componentes.",
      "Testes de rotas e estados de autorização.",
      "Verificação de RLS com usuários e líneas de negócio distintas.",
      "Build de produção e revisão do console do navegador.",
      "Checklist de regressão para comandas, caixa e relatórios."
    ]
  },
  {
    title: "11. Deploy, infraestrutura e operação",
    paragraphs: [
      "O frontend é empacotado pelo Vite como artefato estático e pode ser hospedado em uma plataforma compatível com aplicações SPA. O backend é gerenciado pelo Supabase, onde Auth, banco, migrations e policies são administrados de forma independente. A publicação do frontend não substitui a aplicação de migrations.",
      "A operação deve considerar Health checks, uso de ambiente, autenticação eroles, limites de requisição, custo do banco, observabilidade de erros e disponibilidade. Para PWA, o service worker deve usar uma estratégia de cache que preserve a atualização do aplicativo e evite serving  files after a new publication."
    ],
    bullets: [
      "Separar configurações de desenvolvimento, homologação e produção.",
      "Executar migrations antes de publicar funcionalidades que dependem do novo schema.",
      "Verificar policies no ambiente de destino.",
      "Monitorar erros de autenticação e consultas.",
      "Manter backup e política de recuperação do banco.",
      "Documentar processos de rollback de frontend e rollback de migration."
    ]
  },
  {
    title: "12. Evolução e roadmap técnico",
    paragraphs: [
      "A evolução natural do produto inclui melhoria de observabilidade, testes de integração com Supabase,REFACTOR of screens that share repeated forms, richer operational reports and improvements in accessibility. The adoption of a query cache strategy with TanStack Query can reduce manual state synchronization and improve resilience during reconnection.",
      "Novas funcionalidades devem ser implementadas de forma incremental. Before altering the database, the impact on existing data, reports and permissions should be mapped. After implementation, the complete flow should be validated with real accounts of different profiles, including validations of data isolation."
    ],
    bullets: [
      "Testes de integração para os principais fluxos financeiros.",
      "Cache e invalidação de consultas com TanStack Query.",
      "Exportação de relatórios em formatos adicionais.",
      "Gestão avançada de permissões.",
      "Melhorias de acessibilidade e navegação por teclado.",
      "Monitoramento de desempenho e alertas operacionais."
    ]
  },
  {
    title: "13. Conclusão",
    paragraphs: [
      "O FluxoComanda possui uma arquitetura modular voltada a acompanhar a evolução do produto sem comprometer a simplicidade operacional. A separação entre componentes, hooks, páginas, integrações e migrations permite manter o sistema compreensível, testável e seguro.",
      "A qualidade da implementação depende da alinhamento entre frontend, policies de acesso, schema e regras operacionais. Novas mudanças devem ser avaliadas quanto a impacto visual, segurança, dados, desempenho, testes e documentação. Esse documento serve como referência técnica geral para manutenção, evolução e onboarding de novos desenvolvedores."
    ]
  }
];

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("FluxoComanda · Documento técnico", margin, pageHeight - 7);
    doc.text(`${page}/${pageCount}`, pageWidth / 2, pageHeight - 7, { align: "center" });
    doc.text("by FCIA", pageWidth - margin, pageHeight - 7, { align: "right" });
  }
}

function addHeader(doc: jsPDF, businessName: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(34, 197, 94);
  doc.text("FLUXOCOMANDA", margin, 12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(businessName, pageWidth - margin, 12, { align: "right" });
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.25);
  doc.line(margin, 15, pageWidth - margin, 15);
}

export function buildTechnicalDocumentPdf(businessName: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const title = businessName?.trim() || "FluxoComanda";

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 82, "F");
  doc.setTextColor(34, 197, 94);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("FLUXOCOMANDA", margin, 24);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text("Documento técnico", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Visão geral de desenvolvimento, arquitetura e operação", margin, 53);
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(10);
  doc.text(title, margin, 66);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  doc.text("Documento geral · Versão 1.0", margin, 96);
  doc.text("Gerado localmente pelo aplicativo em formato PDF", margin, 102);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Escopo", margin, 116);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const scope = "Arquitetura da aplicação, organização do código, modelo de dados, fluxos operacionais, segurança, relatórios, testes, deploy e evolução do FluxoComanda.";
  const scopeLines = doc.splitTextToSize(scope, contentWidth);
  doc.text(scopeLines, margin, 124);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Documento técnico de referência para desenvolvimento e manutenção.", margin, 142);

  let cursorY = 155;
  sections.forEach((section, sectionIndex) => {
    if (cursorY > pageHeight - 35) {
      doc.addPage();
      addHeader(doc, title);
      cursorY = 24;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(section.title, margin, cursorY);
    cursorY += 7;

    section.paragraphs.forEach((paragraph) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(paragraph, contentWidth);
      if (cursorY + lines.length * 4.5 > pageHeight - 20) {
        doc.addPage();
        addHeader(doc, title);
        cursorY = 24;
      }
      doc.text(lines, margin, cursorY, { lineHeightFactor: 1.35 });
      cursorY += lines.length * 4.5 + 4;
    });

    if (section.bullets?.length) {
      section.bullets.forEach((bullet) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.2);
        doc.setTextColor(51, 65, 85);
        const lines = doc.splitTextToSize(bullet, contentWidth - 6);
        if (cursorY + lines.length * 4.5 > pageHeight - 20) {
          doc.addPage();
          addHeader(doc, title);
          cursorY = 24;
        }
        doc.setTextColor(34, 197, 94);
        doc.text("•", margin + 1, cursorY);
        doc.setTextColor(51, 65, 85);
        doc.text(lines, margin + 6, cursorY, { lineHeightFactor: 1.3 });
        cursorY += lines.length * 4.2 + 2;
      });
    }

    if (sectionIndex < sections.length - 1) {
      cursorY += 5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 7;
    }
  });

  addFooter(doc);
  doc.save(`documento-tecnico-${(title || "fluxocomanda").toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "fluxocomanda"}.pdf`);
}
