import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AdminBlockEditor from "../components/AdminBlockEditor";

export default function HelpAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [editingBlock, setEditingBlock] = useState(null); // null | "new" | block object
  const [headerTitle, setHeaderTitle] = useState("");
  const [headerDesc, setHeaderDesc] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      if (u?.role !== "admin") navigate("/help" + window.location.search);
      setUser(u);
    });
  }, []);

  const { data: configs = [] } = useQuery({
    queryKey: ["helpMenuConfig"],
    queryFn: () => base44.entities.HelpMenuConfig.list(),
  });

  const config = configs[0];

  useEffect(() => {
    if (config) {
      setHeaderTitle(config.headerTitle || "");
      setHeaderDesc(config.headerDescription || "");
      setWhatsappUrl(config.whatsappHelpUrl || "");
      setWhatsappEnabled(config.whatsappHelpEnabled || false);
    }
  }, [config]);

  const { data: blocks = [] } = useQuery({
    queryKey: ["helpInfoBlocks"],
    queryFn: () => base44.entities.HelpInfoBlock.list("sortOrder"),
  });

  const saveConfig = async () => {
    setSavingConfig(true);
    const data = { headerTitle, headerDescription: headerDesc, whatsappHelpUrl: whatsappUrl, whatsappHelpEnabled: whatsappEnabled, moduleName: "help" };
    if (config) {
      await base44.entities.HelpMenuConfig.update(config.id, data);
    } else {
      await base44.entities.HelpMenuConfig.create(data);
    }
    queryClient.invalidateQueries({ queryKey: ["helpMenuConfig"] });
    setSavingConfig(false);
  };

  const handleBlockSave = async (blockData) => {
    if (editingBlock === "new") {
      await base44.entities.HelpInfoBlock.create({ ...blockData, sortOrder: blocks.length });
    } else {
      await base44.entities.HelpInfoBlock.update(editingBlock.id, blockData);
    }
    queryClient.invalidateQueries({ queryKey: ["helpInfoBlocks"] });
    setEditingBlock(null);
  };

  const handleBlockDelete = async (id) => {
    await base44.entities.HelpInfoBlock.delete(id);
    queryClient.invalidateQueries({ queryKey: ["helpInfoBlocks"] });
    setEditingBlock(null);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(blocks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    // Update sort orders
    for (let i = 0; i < items.length; i++) {
      if (items[i].sortOrder !== i) {
        await base44.entities.HelpInfoBlock.update(items[i].id, { sortOrder: i });
      }
    }
    queryClient.invalidateQueries({ queryKey: ["helpInfoBlocks"] });
  };

  if (editingBlock) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
          <button onClick={() => setEditingBlock(null)} className="flex items-center gap-1 text-sm text-primary mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to admin
          </button>
          <h2 className="text-lg font-bold mb-4">
            {editingBlock === "new" ? "New Info Block" : "Edit Info Block"}
          </h2>
          <AdminBlockEditor
            block={editingBlock === "new" ? null : editingBlock}
            onSave={handleBlockSave}
            onCancel={() => setEditingBlock(null)}
            onDelete={editingBlock !== "new" ? handleBlockDelete : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-5 pt-6 pb-8">
        <button onClick={() => navigate("/help" + window.location.search)} className="flex items-center gap-1 text-sm text-primary mb-4 py-2 pr-4">
          <ArrowLeft className="w-4 h-4" /> Back to directory
        </button>

        <h1 className="text-xl font-bold text-foreground mb-6">Admin Management</h1>

        {/* Config Section */}
        <div className="bg-card border rounded-xl p-4 space-y-4 mb-8">
          <h2 className="text-sm font-semibold text-foreground">Menu Settings</h2>
          <div>
            <Label className="text-xs text-muted-foreground">Header Title</Label>
            <Input value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Header Description</Label>
            <Input value={headerDesc} onChange={(e) => setHeaderDesc(e.target.value)} className="mt-1" />
          </div>
          <div className="flex items-center justify-between py-1">
            <Label className="text-sm font-medium">Activate WhatsApp Help</Label>
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">WhatsApp Help URL</Label>
            <Input value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} className="mt-1" placeholder="https://wa.me/..." />
          </div>
          <Button onClick={saveConfig} disabled={savingConfig} size="sm">
            {savingConfig ? "Saving…" : "Save Settings"}
          </Button>
        </div>

        {/* Blocks Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Info Blocks</h2>
          <Button size="sm" variant="outline" onClick={() => setEditingBlock("new")}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={String(block.id)} index={index}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        className="flex items-center gap-3 bg-card border rounded-lg p-3 select-none cursor-grab active:cursor-grabbing"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-sm truncate">
                          {block.title}
                          {block.isActive === false && (
                            <span className="ml-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              Inactive
                            </span>
                          )}
                        </span>
                        <Button size="sm" variant="ghost" onClick={() => setEditingBlock(block)}>
                          Edit
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {blocks.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No info blocks yet. Tap Add to create one.</p>
        )}
      </div>
    </div>
  );
}