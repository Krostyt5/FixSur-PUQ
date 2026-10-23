// Datos de pago (EJEMPLO: reemplazar por los datos bancarios reales del negocio).
export const BANK = {
  holder: "FixSur SpA",
  rut: "77.777.777-7",
  bank: "Banco Estado",
  accountType: "Cuenta Corriente",
  account: "000000000",
  email: "pagos@fixsur.cl",
};

export type PaymentMethod = "web" | "transferencia" | "qr";

export const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string }[] = [
  { id: "web", label: "Pago web", description: "Tarjeta de débito o crédito en línea (link de pago enviado por correo/WhatsApp)." },
  { id: "transferencia", label: "Transferencia", description: "Transfiere antes o el día de la visita con los datos bancarios." },
  { id: "qr", label: "Código QR", description: "Escanea el QR con la app de tu banco, en la web o en la visita." },
];

export function qrPayload(orderId: string, total: number) {
  return [
    `Pago ${orderId}`,
    `Monto: ${total} CLP`,
    `Titular: ${BANK.holder}`,
    `RUT: ${BANK.rut}`,
    `${BANK.bank} - ${BANK.accountType} ${BANK.account}`,
    `Correo: ${BANK.email}`,
  ].join("\n");
}
