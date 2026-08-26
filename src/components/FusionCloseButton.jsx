import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isInFusionIframe, closeComponent } from "@/lib/fusionBridge";

// Floating "Back" button shown only when the app is embedded in a fusion
// iframe. Clicking it asks the host to close/dismiss the component.
export default function FusionCloseButton() {
  if (!isInFusionIframe()) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-20">
      <Button onClick={closeComponent} className="gap-1.5" variant="default" size="sm">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
    </div>
  );
}