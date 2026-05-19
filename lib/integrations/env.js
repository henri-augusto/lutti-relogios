export function getRuntimeEnv(name) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function getFirstRuntimeEnv(names) {
  for (const name of names) {
    const value = getRuntimeEnv(name);
    if (value) {
      return value;
    }
  }
  return "";
}
