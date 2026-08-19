import { brl } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface BusinessProfile {
  business_name: string | null;
  logo_url: string | null;
  brand_color: string;
  printer_width?: string;
}

interface ComandaPrintProps {
  order: any;
  items: any[];
  business: BusinessProfile;
  customer?: { name?: string; whatsapp?: string } | null;
}

export function ComandaPrint({ order, items, business, customer }: ComandaPrintProps) {
  const printerWidth = business.printer_width === "58mm" ? "58mm" : "80mm";
  const now = new Date();

  return (
    <div
      id="comanda-print-area"
      className={cn(
        "hidden print:block font-mono text-black bg-white mx-auto",
        printerWidth === "58mm" ? "w-[58mm] text-[10px]" : "w-[80mm] text-[12px]"
      )}
      style={{
        padding: printerWidth === "58mm" ? "2mm" : "4mm",
      }}
    >
      {/* Cabeçalho */}
      <div className="text-center mb-4 space-y-1">
        {business.logo_url && (
          <img
            src={business.logo_url}
            alt="Logo"
            className="mx-auto max-h-16 object-contain mb-2"
            style={{ maxWidth: printerWidth === "58mm" ? "40mm" : "60mm" }}
          />
        )}
        <h1 className="font-bold uppercase text-lg">{business.business_name}</h1>
        <p className="text-[10px] opacity-70">FluxoComanda</p>
      </div>

      <div className="border-b border-dashed border-black mb-2" />

      {/* Info Comanda */}
      <div className="mb-3 space-y-1">
        <div className="flex justify-between font-bold">
          <span>Comanda:</span>
          <span>#{order.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div className="flex justify-between">
          <span>Data:</span>
          <span>{now.toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="flex justify-between">
          <span>Hora:</span>
          <span>{now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="capitalize">{order.status === 'open' ? 'Em aberto' : order.status}</span>
        </div>
      </div>

      {/* Info Cliente */}
      {(order.customer_name || customer?.name) && (
        <div className="mb-3 p-1 border border-black rounded space-y-1">
          <p className="font-bold">Cliente:</p>
          <p>{order.customer_name || customer?.name}</p>
          {customer?.whatsapp && <p>Tel: {customer.whatsapp}</p>}
        </div>
      )}

      <div className="border-b border-dashed border-black mb-2" />

      {/* Itens */}
      <table className="w-full mb-3 text-left border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="py-1">Qtd</th>
            <th className="py-1">Item</th>
            <th className="py-1 text-right">Sub</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-dashed border-gray-300 last:border-0">
              <td className="py-1 align-top">{item.quantity}x</td>
              <td className="py-1 align-top">
                <span className="block font-bold">{item.product_name}</span>
                <span className="text-[9px]">{brl.format(item.unit_price)}/un</span>
              </td>
              <td className="py-1 align-top text-right font-bold">
                {brl.format(item.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-b border-black mb-2" />

      {/* Totais */}
      <div className="space-y-1 text-right font-bold">
        <div className="flex justify-between text-lg">
          <span>TOTAL:</span>
          <span>{brl.format(order.total)}</span>
        </div>
        {order.payment_method && (
          <div className="flex justify-between text-[10px]">
            <span>Pagamento:</span>
            <span className="capitalize">{order.payment_method}</span>
          </div>
        )}
      </div>

      {/* Observações */}
      {order.guardada_obs && (
        <div className="mt-4 p-2 border border-dashed border-black text-[10px]">
          <p className="font-bold mb-1 underline">Observações:</p>
          <p>{order.guardada_obs}</p>
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-8 text-center text-[10px] space-y-1">
        <p className="font-bold">Obrigado pela preferência!</p>
        <p>FluxoComanda by FCIA</p>
        <p className="text-[8px] opacity-50">Soluções Inteligentes</p>
      </div>

      {/* Margem de corte inferior */}
      <div className="h-12" />
    </div>
  );
}
