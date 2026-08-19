# Plano de Implementação: Impressão de Comandas

Adicionar funcionalidade de impressão térmica (58mm/80mm) no FluxoComanda usando a função nativa do navegador.

## 🛠️ Alterações Técnicas

### 1. Banco de Dados (Supabase)
- Adicionar coluna `printer_width` (`58mm` ou `80mm`) na tabela `profiles` para salvar a preferência do usuário.

### 2. Frontend
- **Configurações**: Adicionar seletor de largura da impressora na tela "Meu Negócio".
- **Componente de Impressão**: Criar `src/components/print/ComandaPrint.tsx` com layout otimizado para bobinas térmicas.
- **Integração**: Adicionar o botão "Imprimir Comanda" em `src/pages/ComandaDetalhe.tsx`, funcionando em qualquer status da comanda (Aberta, Guardada, Fechada).
- **CSS Print**: Implementar regras `@media print` para garantir que apenas o comprovante seja visível ao imprimir, ocultando o restante da interface.

## 📝 Requisitos do Comprovante
- Logo e Nome do Negócio.
- Data, Hora e Número da Comanda.
- Dados do Cliente (Nome/Telefone).
- Lista de Itens (Qtd, Nome, Preço Unitário, Subtotal).
- Total e Forma de Pagamento.
- Rodapé com "FluxoComanda by FCIA".

## 🚀 Próximos Passos
1. Rodar SQL no backend.
2. Atualizar hook `useBusiness` para suportar `printer_width`.
3. Criar o componente de impressão.
4. Adicionar o botão e lógica de disparar a impressão na tela de detalhes da comanda.
5. Adicionar a configuração na tela de Meu Negócio.
