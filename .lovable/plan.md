
## Ajuste no envio de resumo via WhatsApp

### Arquivo
`src/pages/ComandaDetalhe.tsx` — função `sendWhatsApp` (linhas 317–330)

### Mudança
Detectar se o usuário está em mobile (Android/iPhone/iPad/iPod) e escolher o esquema de URL:

- **Mobile** → `whatsapp://send?phone=55{numero}&text={mensagem}` (abre o app diretamente)
- **Desktop** → `https://wa.me/55{numero}?text={mensagem}` (abre WhatsApp Web)

`window.open(url, "_blank", "noopener,noreferrer")` continua igual.

### Diff resumido

```ts
const sendWhatsApp = () => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) {
    toast.error("Informe um WhatsApp válido");
    return;
  }
  const fullNumber = digits.startsWith("55") ? digits : `55${digits}`;
  const message = buildWhatsAppMessage();
  const encoded = encodeURIComponent(message);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile
    ? `whatsapp://send?phone=${fullNumber}&text=${encoded}`
    : `https://wa.me/${fullNumber}?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
  setCloseOpen(false);
  setClosedSnapshot(null);
  navigate(postSaleRedirect, { replace: true });
};
```

### Resultado esperado
- No celular do garçom → abre o app WhatsApp com a conversa pronta
- No desktop → abre `web.whatsapp.com` (via `wa.me`) numa nova aba

Sem outras alterações de fluxo, layout ou mensagem.
