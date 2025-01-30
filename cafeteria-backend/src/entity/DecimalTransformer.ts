import Decimal from "decimal.js";
import { ValueTransformer } from "typeorm";

export class DecimalTransformer implements ValueTransformer {
  /**
   * Used to marshal Decimal when writing to the database.
   */
  to(decimal?: number): string | null {
    return decimal?.toFixed(2) ?? null;
  }
  /**
   * Used to unmarshal Decimal when reading from the database.
   */
  from(decimal?: any): number | null {
    return decimal ? parseFloat(decimal) : null;
  }
}

export const DecimalToString =
  (decimals: number = 2) =>
  (decimal?: Decimal) =>
    decimal?.toFixed?.(decimals) || decimal;
