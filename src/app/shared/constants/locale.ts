import { environment } from '../../../environments/environment';

/**
 * Locale constants — used in templates for labels.
 * All currency-related labels should use these instead of hardcoding ₹.
 */
export const CURRENCY = environment.currencySymbol;
export const CURRENCY_CODE = environment.currencyCode;
export const LOCALE = environment.locale;
