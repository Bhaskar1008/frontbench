/**
 * Token Cost Calculator
 * Calculates costs based on OpenAI pricing (converted to INR)
 * Pricing as of 2024: GPT-4o-mini costs
 */

// OpenAI pricing per 1M tokens (in USD)
// Converting to INR at approximate rate of 1 USD = 83 INR
const USD_TO_INR = 83;

const PRICING = {
  'gpt-4o-mini': {
    input: 0.15 / 1000, // USD per 1K tokens
    output: 0.6 / 1000, // USD per 1K tokens
  },
  'gpt-4o': {
    input: 2.5 / 1000,
    output: 10 / 1000,
  },
  'gpt-4': {
    input: 30 / 1000,
    output: 60 / 1000,
  },
  'gpt-3.5-turbo': {
    input: 0.5 / 1000,
    output: 1.5 / 1000,
  },
};

/**
 * Calculate cost for token usage
 * @param model Model name
 * @param promptTokens Number of prompt tokens
 * @param completionTokens Number of completion tokens
 * @returns Cost in INR
 */
export function calculateTokenCost(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  const modelPricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o-mini'];
  
  const inputCostUSD = (promptTokens / 1000) * modelPricing.input;
  const outputCostUSD = (completionTokens / 1000) * modelPricing.output;
  const totalCostUSD = inputCostUSD + outputCostUSD;
  
  // Convert to INR
  const totalCostINR = totalCostUSD * USD_TO_INR;
  
  return Math.round(totalCostINR * 100) / 100; // Round to 2 decimal places
}

/**
 * Get cost per 1K tokens for a model
 * @param model Model name
 * @returns Average cost per 1K tokens in INR
 */
export function getCostPer1KTokens(model: string): number {
  const modelPricing = PRICING[model as keyof typeof PRICING] || PRICING['gpt-4o-mini'];
  const avgCostUSD = (modelPricing.input + modelPricing.output) / 2;
  return Math.round(avgCostUSD * USD_TO_INR * 100) / 100;
}
