const formatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatEUR(amount: number): string {
  return formatter.format(amount);
}

export function formatBalance(amount: number): string {
  if (Math.abs(amount) < 0.01) return "Estáis en paz";
  const abs = formatEUR(Math.abs(amount));
  return amount > 0 ? `Te deben ${abs}` : `Debes ${abs}`;
}
