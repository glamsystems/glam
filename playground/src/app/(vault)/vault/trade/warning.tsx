import { WarningCard } from "@/components/WarningCard";

export const ExactOutWarning = () => (
  <div className="p-4">
    <WarningCard message="ExactOut swap supports less liquidity venues and less routes. It might also offer a worse price. Slippage is only applied on input amount, not output amount." />
  </div>
);
