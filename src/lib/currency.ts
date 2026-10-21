// TenderPilot AI stores money in South African rand (the database default is 'ZAR').
export const BASE_CURRENCY = 'ZAR';

export type Currency = { code: string; name: string; symbol: string };

export const currencies: Currency[] = [
  { code: 'ZAR', name: 'South African rand', symbol: 'R' },
  { code: 'USD', name: 'US dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British pound', symbol: '£' },
  { code: 'BWP', name: 'Botswana pula', symbol: 'P' },
  { code: 'NAD', name: 'Namibian dollar', symbol: 'N$' },
  { code: 'LSL', name: 'Lesotho loti', symbol: 'L' },
  { code: 'SZL', name: 'Eswatini lilangeni', symbol: 'E' },
  { code: 'MZN', name: 'Mozambican metical', symbol: 'MT' },
  { code: 'ZMW', name: 'Zambian kwacha', symbol: 'K' },
  { code: 'MWK', name: 'Malawian kwacha', symbol: 'MK' },
  { code: 'NGN', name: 'Nigerian naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian cedi', symbol: 'GH₵' },
  { code: 'EGP', name: 'Egyptian pound', symbol: 'E£' },
  { code: 'MAD', name: 'Moroccan dirham', symbol: 'MAD ' },
  { code: 'AED', name: 'UAE dirham', symbol: 'AED ' },
  { code: 'CNY', name: 'Chinese yuan', symbol: 'CN¥' },
  { code: 'INR', name: 'Indian rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss franc', symbol: 'CHF ' },
  { code: 'BRL', name: 'Brazilian real', symbol: 'R$' },
];

export function findCurrency(code: string): Currency {
  return currencies.find((currency) => currency.code === code) ?? { code, name: code, symbol: `${code} ` };
}

function withThousands(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Hand-rolled rather than Intl, whose compact notation is not reliable on every Hermes build.
export function formatAmount(value: number, code: string, compact = true) {
  const { symbol } = findCurrency(code);
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (!compact || abs < 1_000) {
    return `${sign}${symbol}${withThousands(abs)}`;
  }

  const [divisor, suffix] = abs >= 1e9 ? [1e9, 'B'] : abs >= 1e6 ? [1e6, 'M'] : [1e3, 'k'];
  const scaled = (abs / divisor).toFixed(1).replace(/\.0$/, '');
  return `${sign}${symbol}${scaled}${suffix}`;
}
