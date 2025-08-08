/**
 * Utility functions for formatting Pakistani Rupee currency
 */

export function formatPKR(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rs. ${numAmount.toLocaleString('en-PK', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })}`;
}

export function formatPKRWithoutDecimals(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `Rs. ${Math.floor(numAmount).toLocaleString('en-PK')}`;
}

export const PKR_SYMBOL = 'Rs.';
export const CURRENCY_CODE = 'PKR';