import Decimal from "decimal.js";
import { ValueTransformer } from "typeorm";

export class DecimalTransformer implements ValueTransformer {
  /**
   * Used to marshal Decimal when writing to the database.
   */
  to(decimal?: number | null): string | null {
    return decimal != null ? Number(decimal).toFixed(2) : null;
  }
  /**
   * Used to unmarshal Decimal when reading from the database.
   * Must not treat 0 as missing — `decimal ? …` would turn zero credits into null.
   */
  from(decimal?: any): number | null {
    if (decimal === null || decimal === undefined || decimal === "") {
      return null;
    }
    return parseFloat(decimal);
  }
}

export const DecimalToString =
  (decimals: number = 2) =>
  (decimal?: Decimal) =>
    decimal?.toFixed?.(decimals) || decimal;
