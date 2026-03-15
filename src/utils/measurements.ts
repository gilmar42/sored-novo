
export const parseFraction = (value: string | number | undefined): number => {
  if (value === undefined || value === null || value === '') return 0;
  
  const strValue = value.toString().replace(',', '.').trim();
  
  // Se for um número puro (ex: "1.5")
  if (!isNaN(Number(strValue))) return Number(strValue);

  // Se for uma fração ou número misto (ex: "1/2" ou "1 1/4")
  const parts = strValue.split(/\s+/);
  let total = 0;

  for (const part of parts) {
    if (part.includes('/')) {
      const [num, den] = part.split('/').map(Number);
      if (den !== 0 && !isNaN(num) && !isNaN(den)) {
        total += num / den;
      }
    } else {
      const num = Number(part);
      if (!isNaN(num)) {
        total += num;
      }
    }
  }

  return total;
};
