import "server-only";

export type TransferInfo = {
  alias: string;
  cbu: string | null;
  titular: string | null;
  banco: string | null;
  whatsapp: string | null;
};

/** Datos bancarios cargados en Vercel. Sin alias o CBU, la transferencia está desactivada. */
export function transferInfo(): TransferInfo | null {
  const alias = process.env.TRANSFER_ALIAS?.trim() || "";
  const cbu = process.env.TRANSFER_CBU?.trim() || null;
  if (!alias && !cbu) return null;
  return {
    alias,
    cbu,
    titular: process.env.TRANSFER_TITULAR?.trim() || null,
    banco: process.env.TRANSFER_BANCO?.trim() || null,
    // Solo números, con código de país. Ej: 5491155555555
    whatsapp: process.env.WHATSAPP_NUMERO?.replace(/\D/g, "") || null,
  };
}

export function mercadoPagoEnabled(): boolean {
  return Boolean(process.env.MP_ACCESS_TOKEN);
}

export type PaymentOptions = { transfer: boolean; mercadopago: boolean };

export function paymentOptions(): PaymentOptions {
  return { transfer: transferInfo() !== null, mercadopago: mercadoPagoEnabled() };
}
