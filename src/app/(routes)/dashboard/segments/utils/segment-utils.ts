import type { SegmentCondition } from "../types";

/**
 * Generate human-readable criteria display from segment conditions
 * Used by both server actions and API routes
 */
export function generateCriteriaDisplay(
  conditions: SegmentCondition[]
): string {
  if (!conditions.length) return "No conditions defined";

  return conditions
    .map((condition, index) => {
      let display = "";

      if (index > 0 && condition.logicalOperator) {
        display += ` ${condition.logicalOperator} `;
      }

      display += `${condition.category} ${condition.operator}`;

      if (condition.value) {
        display += ` ${condition.value}`;
      } else if (condition.numberValue !== undefined) {
        display += ` ${condition.numberValue}`;
      } else if (condition.dateValue) {
        display += ` ${condition.dateValue}`;
        if (condition.dateUnit) {
          display += ` ${condition.dateUnit}`;
        }
      } else if (
        condition.locationCountry ||
        condition.locationRegion ||
        condition.locationCity
      ) {
        const location = [
          condition.locationCity,
          condition.locationRegion,
          condition.locationCountry,
        ]
          .filter(Boolean)
          .join(", ");
        display += ` ${location}`;
      }

      return display;
    })
    .join("");
}
