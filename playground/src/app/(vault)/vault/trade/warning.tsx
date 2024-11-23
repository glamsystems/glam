import { Card } from "@/components/ui/card";

export const ExactOutWarning = () => (
  <div className="p-4">
    <Card className="border border-orange-500/20 bg-orange-500/5 p-4">
      <div className="flex">
        <p className="text-sm text-orange-400">
          ExactOut swap supports less liquidity venues and less routes. It might
          also offer a worse price. Slippage is only applied on input amount,
          not output amount.
        </p>
      </div>
    </Card>
  </div>
);
