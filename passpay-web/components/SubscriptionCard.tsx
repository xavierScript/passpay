import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SubscriptionCard({
  title,
  price,
  description,
  onSubscribe,
  highlighted,
}: {
  title: string;
  price: number;
  description: string;
  onSubscribe: () => void;
  highlighted?: boolean;
}) {
  return (
    <Card className={highlighted ? "border-indigo-600" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          {highlighted && (
            <span className="rounded-full bg-indigo-600 px-2 py-1 text-xs">
              Recommended
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {price} <span className="text-sm font-normal">SOL/mo</span>
        </p>
        <p className="mt-2 text-sm text-neutral-300">{description}</p>
        <Button className="mt-4 w-full" onClick={onSubscribe}>
          Subscribe
        </Button>
      </CardContent>
    </Card>
  );
}
