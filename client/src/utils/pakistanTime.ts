// Pakistan Time Utility Functions
// App hardcoded to Pakistan timezone (PKT/PST - UTC+5)

export const PAKISTAN_TIMEZONE = 'Asia/Karachi';

/**
 * Get current date and time in Pakistan timezone
 */
export function getCurrentPakistanTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: PAKISTAN_TIMEZONE }));
}

/**
 * Format date in Pakistan timezone
 */
export function formatPakistanDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PAKISTAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options
  };

  return dateObj.toLocaleDateString('en-US', defaultOptions);
}

/**
 * Format date and time in Pakistan timezone
 */
export function formatPakistanDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: PAKISTAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  };

  return dateObj.toLocaleString('en-US', defaultOptions);
}

/**
 * Check if a date is overdue compared to current Pakistan time
 */
export function isOverdue(dueDate: string | Date): boolean {
  const dueDateObj = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const currentPakistanTime = getCurrentPakistanTime();
  
  // Set time to end of day for due date comparison
  const dueDateEndOfDay = new Date(dueDateObj);
  dueDateEndOfDay.setHours(23, 59, 59, 999);
  
  return currentPakistanTime > dueDateEndOfDay;
}

/**
 * Get Pakistan date in YYYY-MM-DD format
 */
export function getPakistanDateString(): string {
  const now = getCurrentPakistanTime();
  return now.toISOString().split('T')[0];
}

/**
 * Convert date to Pakistan timezone and return ISO string
 */
export function toPakistanISOString(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Date(dateObj.toLocaleString("en-US", { timeZone: PAKISTAN_TIMEZONE })).toISOString();
}