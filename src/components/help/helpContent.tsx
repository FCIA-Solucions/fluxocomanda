import { ReactNode } from "react";
import {
  Home,
  ClipboardList,
  Package,
  Wallet,
  Users,
  BarChart3,
  Store,
  CreditCard,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export type HelpRole = "admin" | "superadmin" | "garcom";

export interface HelpItem {
  id: string;
  title: string;
  icon: typeof Home;
  roles: HelpRole[];
  content: ReactNode;
}

function Step({ children }: { children: ReactNode }) {
  return (
    <li className="ml-1 leading-relaxed text-sm text-foreground/90">{children}</li>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-2 text-xs text-foreground/80">
      💡 {children}
    </p>
  );
}

const KEY = {
  open: "Abrir",
  edit: "Editar",
  add: "Adicionar",
};

export const helpContent: HelpItem[] = [
  // ==================== ADMIN / SUPERADMIN ====================
  {
    id: "inicio",
    title: "Início (Dashboard)",
    icon: Home,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>É a sua tela principal. Mostra um resumo do dia:</p>
        <ul className="ml-5 list-disc space-y-1">
          <Step><b>Vendas Hoje</b>: total faturado em comandas fechadas hoje.</Step>
          <Step><b>Comandas Abertas</b>: quantas estão em andamento agora.</Step>
          <Step><b>Fechadas Hoje</b>: quantas vendas foram concluídas no dia.</Step>
          <Step><b>Ticket Médio</b>: valor médio de cada comanda fechada hoje.</Step>
        </ul>
        <p className="pt-2">Use os botões grandes para criar uma <b>Nova Comanda</b> ou ver a lista de comandas atuais.</p>
        <Note>Se aparecer um aviso amarelo no topo, é sobre sua assinatura (vencendo) ou para instalar o app no celular.</Note>
      </div>
    ),
  },
  {
    id: "comandas",
    title: "Comandas",
    icon: ClipboardList,
    roles: ["admin", "superadmin", "garcom"],
    content: (
      <div className="space-y-2">
        <p><b>Abrir uma comanda nova:</b></p>
        <ol className="ml-5 list-decimal space-y-1">
          <Step>Toque em <b>+ Nova Comanda</b>.</Step>
          <Step>Digite o nome do cliente ou número da mesa.</Step>
          <Step>Selecione um cliente cadastrado (se houver) ou cadastre um novo.</Step>
          <Step>A comanda é criada e fica disponível na aba <b>Abertas</b>.</Step>
        </ol>
        <p className="pt-2"><b>Lançar produtos:</b></p>
        <ol className="ml-5 list-decimal space-y-1">
          <Step>Abra a comanda na lista.</Step>
          <Step>Toque em <b>+ Adicionar item</b>, busque ou filtre por categoria.</Step>
          <Step>Use os botões <b>+</b> e <b>−</b> para ajustar a quantidade.</Step>
        </ol>
        <p className="pt-2"><b>Fechar a comanda:</b></p>
        <ol className="ml-5 list-decimal space-y-1">
          <Step>Toque em <b>Fechar comanda</b>.</Step>
          <Step>Escolha a forma de pagamento (Dinheiro, Pix, Cartão).</Step>
          <Step>Confirme. A venda entra no caixa e nos relatórios automaticamente.</Step>
        </ol>
        <Note>Comanda <b>guardada</b> fica salva pra continuar depois (cliente que pediu pra anotar). Não conta em vendas até ser fechada.</Note>
      </div>
    ),
  },
  {
    id: "produtos",
    title: "Produtos",
    icon: Package,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>Cadastre tudo que você vende:</p>
        <ol className="ml-5 list-decimal space-y-1">
          <Step>Toque em <b>+ Novo Produto</b>.</Step>
          <Step>Informe nome, preço de venda e categoria (Bebida, Comida, etc.).</Step>
          <Step>Salve. O produto fica disponível para lançar em comandas.</Step>
        </ol>
        <p className="pt-2"><b>Editar / Desativar:</b> toque no produto para abrir e ajustar. Para tirar de circulação sem apagar, use o switch <b>Ativo</b>.</p>
        <Note>Categorias ajudam o garçom a achar mais rápido na hora de lançar.</Note>
      </div>
    ),
  },
  {
    id: "caixa",
    title: "Caixa",
    icon: Wallet,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>Controla o que entrou no dia, separado por forma de pagamento.</p>
        <ol className="ml-5 list-decimal space-y-1">
          <Step>Cada venda fechada vai automaticamente pro caixa do dia.</Step>
          <Step>No fim do expediente, toque em <b>Fechar Caixa</b>.</Step>
          <Step>Confira os totais por Dinheiro, Pix e Cartão.</Step>
          <Step>Confirme o fechamento — fica registrado no histórico.</Step>
        </ol>
        <Note>O fechamento é só manual. O caixa nunca fecha sozinho.</Note>
      </div>
    ),
  },
  {
    id: "clientes",
    title: "Clientes",
    icon: Users,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>Cadastro opcional para acelerar a abertura de comanda e enviar resumo por WhatsApp.</p>
        <ul className="ml-5 list-disc space-y-1">
          <Step>Cadastre nome, apelido e telefone (WhatsApp).</Step>
          <Step>Na <b>Nova Comanda</b>, comece a digitar o nome — sugestões aparecem automaticamente.</Step>
          <Step>Ao fechar a comanda, o WhatsApp do cliente é usado para mandar o resumo direto.</Step>
        </ul>
      </div>
    ),
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: BarChart3,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>Veja o desempenho do seu negócio em vários períodos:</p>
        <ul className="ml-5 list-disc space-y-1">
          <Step><b>Diário</b>: vendas por dia.</Step>
          <Step><b>Semanal / Mensal</b>: comparativos.</Step>
          <Step><b>Anual</b>: visão geral do ano.</Step>
        </ul>
        <p className="pt-2">Você pode <b>exportar em PDF</b> para imprimir ou enviar para o contador.</p>
      </div>
    ),
  },
  {
    id: "negocio",
    title: "Meu Negócio",
    icon: Store,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>Personalize a identidade do seu estabelecimento:</p>
        <ul className="ml-5 list-disc space-y-1">
          <Step>Nome e logo (aparece no topo do app e no resumo enviado pro cliente).</Step>
          <Step>Cor da marca.</Step>
          <Step>Dados de contato.</Step>
        </ul>
        <Note>Depois de salvar, o app inteiro adota sua cor.</Note>
      </div>
    ),
  },
  {
    id: "assinatura",
    title: "Assinatura",
    icon: CreditCard,
    roles: ["admin", "superadmin"],
    content: (
      <div className="space-y-2">
        <p>Como funciona o pagamento do FluxoComanda:</p>
        <ul className="ml-5 list-disc space-y-1">
          <Step><b>Trial</b>: 7 dias gratuitos pra testar tudo.</Step>
          <Step><b>Mensal</b>: R$ 49/mês.</Step>
          <Step><b>Semestral</b>: R$ 197 (R$ 33/mês).</Step>
          <Step><b>Vitalício</b>: pagamento único, sob consulta.</Step>
        </ul>
        <p className="pt-2">Pague via PIX e envie o comprovante no WhatsApp. Liberação em até 1 hora.</p>
        <p className="pt-2">
          <Button asChild size="sm" variant="outline" className="mt-1">
            <Link to="/status">Ver meu status</Link>
          </Button>
        </p>
      </div>
    ),
  },
  {
    id: "admin",
    title: "Painel Admin",
    icon: ShieldCheck,
    roles: ["superadmin"],
    content: (
      <div className="space-y-2">
        <p>Disponível apenas para o admin do FCIA.</p>
        <ul className="ml-5 list-disc space-y-1">
          <Step>Listar e buscar todos os clientes cadastrados no sistema.</Step>
          <Step>Estender trial, mudar plano ou bloquear/desbloquear acesso.</Step>
          <Step>Ver status detalhado em <Link to="/status" className="text-primary underline">/status</Link>.</Step>
        </ul>
      </div>
    ),
  },
  {
    id: "faq",
    title: "Perguntas frequentes",
    icon: HelpCircle,
    roles: ["admin", "superadmin", "garcom"],
    content: (
      <div className="space-y-3">
        <div>
          <p className="font-semibold">Esqueci a senha</p>
          <p className="text-sm">Saia do app e use a opção <b>"Esqueci minha senha"</b> na tela de login.</p>
        </div>
        <div>
          <p className="font-semibold">Como instalo o app no celular?</p>
          <p className="text-sm">
            <Link to="/instalar" className="text-primary underline">Toque aqui</Link> para ver o passo a passo de instalação.
          </p>
        </div>
        <div>
          <p className="font-semibold">Garçom não aparece na lista</p>
          <p className="text-sm">Confira se ele foi cadastrado em <b>Meu Negócio → Equipe</b>.</p>
        </div>
        <div>
          <p className="font-semibold">Comanda sumiu</p>
          <p className="text-sm">Provavelmente está em outra aba (Guardadas/Fechadas). Use os filtros no topo da lista.</p>
        </div>
        <div>
          <p className="font-semibold">Suporte</p>
          <p className="text-sm">Fale direto com a gente:{" "}
            <a
              href="https://wa.me/5594999553574"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              WhatsApp (94) 99955-3574
            </a>
          </p>
        </div>
      </div>
    ),
  },

  // ==================== GARÇOM (versão enxuta) ====================
  {
    id: "garcom-abrir",
    title: "Abrir uma comanda",
    icon: ClipboardList,
    roles: ["garcom"],
    content: (
      <ol className="ml-5 list-decimal space-y-1">
        <Step>Na tela <b>Comandas</b>, toque no botão <b>+ Nova Comanda</b>.</Step>
        <Step>Digite o nome do cliente ou número da mesa.</Step>
        <Step>Pronto, a comanda já abre vazia para você lançar os pedidos.</Step>
      </ol>
    ),
  },
  {
    id: "garcom-lancar",
    title: "Lançar pedidos",
    icon: Package,
    roles: ["garcom"],
    content: (
      <ol className="ml-5 list-decimal space-y-1">
        <Step>Dentro da comanda, toque em <b>+ Adicionar item</b>.</Step>
        <Step>Filtre por categoria (Bebidas, Comidas, Outros) ou busque pelo nome.</Step>
        <Step>Toque no produto e ele entra na lista. Use <b>+</b> / <b>−</b> para ajustar a quantidade.</Step>
      </ol>
    ),
  },
  {
    id: "garcom-corrigir",
    title: "Corrigir um item",
    icon: Package,
    roles: ["garcom"],
    content: (
      <div className="space-y-2">
        <p>Para mudar a quantidade, use os botões <b>+</b> e <b>−</b> ao lado do item.</p>
        <p>Para remover, deslize ou toque no ícone de lixeira.</p>
        <Note>Se a comanda já estiver fechada, peça para o admin reabrir.</Note>
      </div>
    ),
  },
  {
    id: "garcom-fechar",
    title: "Fechar a comanda",
    icon: Wallet,
    roles: ["garcom"],
    content: (
      <ol className="ml-5 list-decimal space-y-1">
        <Step>Toque em <b>Fechar comanda</b>.</Step>
        <Step>Escolha a forma de pagamento informada pelo cliente.</Step>
        <Step>Confirme. Se o cliente quiser, envie o resumo no WhatsApp na próxima tela.</Step>
      </ol>
    ),
  },
  {
    id: "garcom-suporte",
    title: "Precisa de ajuda?",
    icon: HelpCircle,
    roles: ["garcom"],
    content: (
      <p>
        Fale com seu gestor primeiro. Se for problema do app, chame a gente:{" "}
        <a
          href="https://wa.me/5594999553574"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline"
        >
          WhatsApp (94) 99955-3574
        </a>.
      </p>
    ),
  },
];
