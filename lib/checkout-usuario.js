import {
  findUserByEmail,
  findUserById,
  insertUsuarioCheckoutConvidado,
  normalizeCep,
  normalizeEmail,
} from "@/lib/auth-users";

function metaString(meta, key) {
  const v = meta?.[key];
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Resolve usuario Luti para vincular ao pedido pago (webhook Stripe).
 * Falhas sao logadas; retorna null para nao bloquear persistencia do pedido.
 *
 * @param {object} session Objeto Checkout Session do Stripe
 * @returns {Promise<string | null>} id do usuario ou null
 */
export async function resolveUsuarioIdForPaidSession(session) {
  const stripeEmailRaw =
    session.customer_details?.email?.trim() ||
    (typeof session.customer_email === "string" ? session.customer_email.trim() : "");
  const stripeEmail = normalizeEmail(stripeEmailRaw);
  if (!stripeEmail) {
    return null;
  }

  const meta = session.metadata && typeof session.metadata === "object" ? session.metadata : {};

  try {
    const metaUserId = metaString(meta, "checkout_usuario_id");
    if (metaUserId) {
      const byId = await findUserById(metaUserId);
      if (byId && normalizeEmail(byId.email) === stripeEmail) {
        return String(byId.id);
      }
    }

    const existing = await findUserByEmail(stripeEmail);
    if (existing) {
      return String(existing.id);
    }

    if (metaString(meta, "guest_checkout") !== "1") {
      return null;
    }

    const fullName = metaString(meta, "nome_cliente");
    const phone = metaString(meta, "telefone");
    const docDigits = metaString(meta, "doc").replace(/\D/g, "");
    const cep = normalizeCep(metaString(meta, "cep"));
    const street = metaString(meta, "street");
    const number = metaString(meta, "number");
    const complement = metaString(meta, "complement");
    const neighborhood = metaString(meta, "neighborhood");
    const city = metaString(meta, "city");
    const state = metaString(meta, "state").toUpperCase().slice(0, 2);

    if (
      !fullName ||
      !phone ||
      docDigits.length !== 11 ||
      cep.length !== 8 ||
      !street ||
      !number ||
      !neighborhood ||
      !city ||
      state.length !== 2
    ) {
      console.warn(
        "[checkout-usuario] Metadata insuficiente para criar usuario convidado.",
        session.id,
      );
      return null;
    }

    try {
      const row = await insertUsuarioCheckoutConvidado({
        email: stripeEmail,
        fullName,
        phone,
        document: docDigits,
        cep,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
      });
      return row?.id != null ? String(row.id) : null;
    } catch (err) {
      if (err?.code === "23505") {
        const again = await findUserByEmail(stripeEmail);
        return again?.id != null ? String(again.id) : null;
      }
      throw err;
    }
  } catch (err) {
    console.error("[checkout-usuario] Falha ao resolver usuario:", err?.message || err, session?.id);
    return null;
  }
}
