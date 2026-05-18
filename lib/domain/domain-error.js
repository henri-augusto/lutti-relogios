/**
 * Factory para erros de domínio com `message`, `status` e `cause` opcionais.
 * @param {string} name
 */
export function createDomainErrorClass(name) {
  return class DomainError extends Error {
    /**
     * @param {string} message
     * @param {{ status?: number, cause?: unknown }} [opts]
     */
    constructor(message, opts = {}) {
      super(message);
      this.name = name;
      if (opts.status !== undefined) {
        this.status = opts.status;
      }
      if (opts.cause !== undefined) {
        this.cause = opts.cause;
      }
    }
  };
}
