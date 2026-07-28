import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import InfoBlockCard from "../components/InfoBlockCard";
import { Settings, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HelpDirectory() {
  const navigate = useNavigate();
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver(() => {
      setHeaderHeight(headerRef.current.offsetHeight);
    });
    observer.observe(headerRef.current);
    setHeaderHeight(headerRef.current.offsetHeight);
    return () => observer.disconnect();
  }, []);

  const params = new URLSearchParams(window.location.search);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const isAdmin = params.get("isAdmin") === "true" || isAdminUser;

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.role === "admin") setIsAdminUser(true);
    }).catch(() => {});
  }, []);
  const action = params.get("action");
  const origin = params.get("origin");

  useEffect(() => {
    if (action && origin) {
      window.parent.postMessage({ action, payload: 'appready' }, origin);
    }
  }, []);

  const { data: configs = [] } = useQuery({
    queryKey: ["helpMenuConfig"],
    queryFn: () => base44.entities.HelpMenuConfig.list(),
  });

  const config = configs[0];

  const { data: allBlocks = [] } = useQuery({
    queryKey: ["helpInfoBlocks"],
    queryFn: () => base44.entities.HelpInfoBlock.list("sortOrder"),
  });

  const blocks = isAdmin ? allBlocks : allBlocks.filter((b) => b.isActive !== false);

  const returnUrl = params.get("returnUrl") || "/";

  const handleClose = () => {
    if (returnUrl.startsWith("http")) {
      window.location.href = returnUrl;
    } else {
      navigate(returnUrl);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-10 bg-background border-b">
        <div className="max-w-lg mx-auto px-5 py-5">
          <h1 className="text-2xl font-bold text-primary">
            {config?.headerTitle || "Health onQ Tutorials"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {config?.headerDescription || "Select the tutorial you would like to read up more on."}
          </p>

          <div className="mt-3 mb-1 flex items-end justify-between">
            {isAdmin && (
              <button
                onClick={() => navigate("/help/admin" + window.location.search)}
                className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
              >
                <Settings className="w-3.5 h-3.5" />
                Tap here to manage
              </button>
            )}
            {config?.whatsappHelpEnabled && config?.whatsappHelpUrl && (
              <Button
                onClick={() => window.parent.postMessage({ action: 'openWhatsApp', payload: config.whatsappHelpUrl }, origin || '*')}
                className="ml-auto gap-1.5"
                variant="default"
                size="sm"
              >
                <MessageCircle className="w-4 h-4" />
                Help via WhatsApp
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto" style={{ paddingTop: headerHeight }}>
        <div className="max-w-lg mx-auto px-5 pt-4 pb-4">
          <div className="space-y-3">
            {blocks.map((block) => (
              <div key={block.id} className="relative">
                <InfoBlockCard
                  block={block}
                  onClick={() => navigate(`/help/${block.id}${window.location.search}`)}
                />
                {isAdmin && block.isActive === false && (
                  <span className="absolute top-2 right-2 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                    Hidden
                  </span>
                )}
              </div>
            ))}
            {blocks.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                No help topics available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}