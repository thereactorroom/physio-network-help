import { useParams, useNavigate } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MessageCircle, FileText } from "lucide-react";


export default function HelpDetail() {
  const { blockId } = useParams();
  const headerRef = useRef(null);
  const scrollRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(144);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [blockId]);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      setHeaderHeight(headerRef.current.offsetHeight);
    });
    observer.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);
    return () => observer.disconnect();
  }, []);
  const navigate = useNavigate();

  const { data: configs = [] } = useQuery({
    queryKey: ["helpMenuConfig"],
    queryFn: () => base44.entities.HelpMenuConfig.list(),
  });

  const config = configs[0];

  const { data: blocks = [], isLoading } = useQuery({
    queryKey: ["helpInfoBlock", blockId],
    queryFn: () => base44.entities.HelpInfoBlock.filter({ id: blockId }),
  });

  const block = blocks[0];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!block) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Topic not found
      </div>
    );
  }

  const origin = new URLSearchParams(window.location.search).get('origin');

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-10 bg-background border-b">
        <div className="max-w-lg mx-auto px-5 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2 min-w-0">
              {block?.imageUrl ? (
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-accent flex-shrink-0">
                  <img src={block.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
              )}
              <h1 className="text-lg font-bold text-foreground">{block?.title}</h1>
            </div>
            <div className="flex flex-col items-end justify-between flex-shrink-0 self-stretch">
              {config?.whatsappHelpEnabled && config?.whatsappHelpUrl && (
                <button
                  onClick={() => window.parent.postMessage({ action: 'openWhatsApp', payload: config.whatsappHelpUrl }, origin || '*')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Help
                </button>
              )}
              <button
                onClick={() => navigate("/help" + window.location.search)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary text-primary text-sm font-medium bg-white hover:bg-primary hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingTop: headerHeight }}>
        <div className="max-w-lg mx-auto px-5 pb-4">
          <div
            className="prose prose-sm max-w-none text-foreground/80"
            dangerouslySetInnerHTML={{ __html: block?.detailContent || "<p>No content available.</p>" }}
          />
        </div>
      </div>
    </div>
  );
}