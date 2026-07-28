import { MessageCircle } from "lucide-react";

export default function BottomMenuBar({ onClose, whatsappUrl, closeLabel = "Close" }) {
  const handleHelp = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-primary z-50">
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto">
        <button onClick={handleHelp} className="flex flex-col items-center gap-0.5 text-primary-foreground">
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs font-medium">Help</span>
        </button>
      </div>
    </div>
  );
}