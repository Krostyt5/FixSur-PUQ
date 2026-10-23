import { QRCodeSVG } from "qrcode.react";
import { BANK, qrPayload, type PaymentMethod } from "@/lib/payment";
import { formatCLP } from "@/lib/pricing";

export function PaymentInfo({ method, orderId, total }: { method: PaymentMethod; orderId: string; total: number }) {
  if (method === "web") {
    return (
      <p className="text-sm text-muted-foreground">
        Te enviaremos un link de pago por {formatCLP(total)} para pagar con tarjeta en línea.
      </p>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {method === "qr" && (
        <div className="rounded-lg bg-white p-3">
          <QRCodeSVG value={qrPayload(orderId, total)} size={140} />
        </div>
      )}
      <dl className="grid flex-1 gap-1 text-left text-sm">
        <div><dt className="inline text-muted-foreground">Monto: </dt><dd className="inline font-semibold">{formatCLP(total)}</dd></div>
        <div><dt className="inline text-muted-foreground">Titular: </dt><dd className="inline">{BANK.holder}</dd></div>
        <div><dt className="inline text-muted-foreground">RUT: </dt><dd className="inline">{BANK.rut}</dd></div>
        <div><dt className="inline text-muted-foreground">Banco: </dt><dd className="inline">{BANK.bank} · {BANK.accountType} {BANK.account}</dd></div>
        <div><dt className="inline text-muted-foreground">Correo: </dt><dd className="inline">{BANK.email}</dd></div>
        <div><dt className="inline text-muted-foreground">Asunto: </dt><dd className="inline">{orderId}</dd></div>
      </dl>
    </div>
  );
}
