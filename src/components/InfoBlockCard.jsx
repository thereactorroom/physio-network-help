import { ChevronRight, FileText } from "lucide-react";

export default function InfoBlockCard({ block, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-accent/50 transition-colors text-left active:scale-[0.98]"
    >
      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center flex-shrink-0 overflow-hidden">
        {block.imageUrl ? (
          <img src={block.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <FileText className="w-6 h-6 text-primary" />
        )}
      </div>
      <span className="flex-1 text-sm font-medium text-foreground leading-snug">{block.title}</span>
      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
    </button>
  );
}