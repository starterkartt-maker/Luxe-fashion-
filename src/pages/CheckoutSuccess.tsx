import { Link, useSearchParams } from "react-router";
import { Button } from "../components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const orderId = params.get('order_id');

  return (
    <div className="container mx-auto px-4 py-32 flex flex-col items-center text-center space-y-6">
      <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-4xl font-editorial font-medium">Order Confirmed</h1>
      <p className="text-muted-foreground max-w-md">
        Thank you for shopping with Luxe. Your order has been placed successfully.
      </p>
      
      {orderId && (
        <div className="bg-muted p-4 border border-border w-full max-w-sm">
          <p className="text-sm font-medium">Order Reference</p>
          <p className="text-sm text-muted-foreground font-mono mt-1">{orderId}</p>
        </div>
      )}

      <div className="flex gap-4 pt-8">
        <Link to="/profile">
          <Button variant="outline" className="rounded-none uppercase tracking-widest px-8">View Orders</Button>
        </Link>
        <Link to="/shop">
          <Button className="rounded-none uppercase tracking-widest px-8">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
