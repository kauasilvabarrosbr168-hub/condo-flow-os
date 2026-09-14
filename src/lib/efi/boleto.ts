// Cobranças (boleto) — API v1, autenticação Basic + Bearer, sem mTLS.
// Docs: https://dev.efipay.com.br/docs/api-cobrancas/boleto
import { getEfiChargesBaseUrl } from "./config";
import { getEfiChargesToken } from "./oauth";

export type BoletoCustomer = {
  name: string;
  cpf: string;
  email?: string;
  phoneNumber?: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    zipcode: string;
    city: string;
    state: string;
    complement?: string;
  };
};

export type BoletoChargeResult = {
  chargeId: number;
  barcode: string;
  link: string;
  billetLink: string;
  status: string;
};

export async function createBoletoCharge(opts: {
  itemName: string;
  valueCents: number;
  expireAt: string; // YYYY-MM-DD
  customer: BoletoCustomer;
  message?: string;
}): Promise<BoletoChargeResult> {
  const token = await getEfiChargesToken();

  const res = await fetch(`${getEfiChargesBaseUrl()}/v1/charge/one-step`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [{ name: opts.itemName, value: opts.valueCents, amount: 1 }],
      payment: {
        banking_billet: {
          customer: {
            name: opts.customer.name,
            cpf: opts.customer.cpf,
            email: opts.customer.email,
            phone_number: opts.customer.phoneNumber,
            address: opts.customer.address,
          },
          expire_at: opts.expireAt,
          message: opts.message,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Efí boleto falhou (${res.status}): ${body}`);
  }

  const json = (await res.json()) as {
    data: { charge_id: number; barcode: string; link: string; billet_link: string; status: string };
  };
  return {
    chargeId: json.data.charge_id,
    barcode: json.data.barcode,
    link: json.data.link,
    billetLink: json.data.billet_link,
    status: json.data.status,
  };
}

// O webhook de boleto envia só um token — o valor real vem desta consulta.
// https://dev.efipay.com.br/docs/api-cobrancas/notificacoes
export async function getBoletoNotification(notificationToken: string) {
  const authToken = await getEfiChargesToken();
  const res = await fetch(`${getEfiChargesBaseUrl()}/v1/notification/${notificationToken}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) throw new Error(`Efí notification lookup falhou (${res.status})`);
  return (await res.json()) as {
    data: Array<{ identifiers: { charge_id: number }; status: string }>;
  };
}

// NOTA: endpoint de cancelamento não verificado contra a doc ao vivo — confirme
// em https://dev.efipay.com.br/docs/api-cobrancas/boleto antes de usar em produção.
export async function cancelBoletoCharge(chargeId: number): Promise<void> {
  const token = await getEfiChargesToken();
  const res = await fetch(`${getEfiChargesBaseUrl()}/v1/charge/${chargeId}/cancel`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Efí cancelamento falhou (${res.status}): ${body}`);
  }
}
