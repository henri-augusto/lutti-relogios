/** Parseia o corpo JSON da request; retorna {} em caso de falha ou corpo vazio. */
export async function safeJson(request) {
  return request.json().catch(() => ({}));
}
