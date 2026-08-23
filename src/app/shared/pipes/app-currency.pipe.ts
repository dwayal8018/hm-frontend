import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Replaces hardcoded ₹ with the configured currency symbol.
 * Usage: {{ amount | appCurrency }}           → ₹1,234
 *        {{ amount | appCurrency:'1.2-2' }}   → ₹1,234.00
 *
 * Reads currencySymbol from environment config.
 * Change environment.currencySymbol to '€', '$', etc. for different countries.
 */
@Pipe({ name: 'appCurrency', standalone: true })
export class AppCurrencyPipe implements PipeTransform {
  private symbol = environment.currencySymbol;

  transform(value: number | null | undefined, format: string = '1.0-0'): string {
    if (value == null) return `${this.symbol}0`;
    // Use Intl.NumberFormat for locale-aware formatting
    const parts = format.split('.');
    const minFraction = parts.length > 1 ? parseInt(parts[1].split('-')[0]) : 0;
    const maxFraction = parts.length > 1 ? parseInt(parts[1].split('-')[1] ?? parts[1].split('-')[0]) : 0;

    const formatted = new Intl.NumberFormat(environment.locale, {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction
    }).format(value);

    return `${this.symbol}${formatted}`;
  }
}
