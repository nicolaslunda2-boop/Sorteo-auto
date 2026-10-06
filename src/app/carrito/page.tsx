import { CheckoutClient } from "@/components/CheckoutClient";
import { paymentOptions } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default function CarritoPage() {
  return <CheckoutClient options={paymentOptions()} />;
}
