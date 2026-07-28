import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RichTextEditor from "./RichTextEditor";

export default function AdminBlockEditor({ block, onSave, onCancel, onDelete }) {
  const [title, setTitle] = useState(block?.title || "");
  const [detailContent, setDetailContent] = useState(block?.detailContent || "");
  const [isActive, setIsActive] = useState(block?.isActive !== false);
  const [imageUrl, setImageUrl] = useState(block?.imageUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImageUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ title, detailContent, isActive, imageUrl });
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs text-muted-foreground">Image</Label>
        <div className="mt-1 flex items-center gap-3">
          {imageUrl && (
            <img src={imageUrl} alt="" className="w-14 h-14 rounded-lg object-cover border" />
          )}
          <label className="text-xs text-primary font-medium cursor-pointer hover:underline">
            {imageUrl ? "Replace image" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
          </label>
          {uploading && <span className="text-xs text-muted-foreground">Uploading…</span>}
        </div>
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">Detail Content</Label>
        <div className="mt-1">
          <RichTextEditor value={detailContent} onChange={setDetailContent} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isActive} onCheckedChange={setIsActive} />
        <Label className="text-sm">{isActive ? "Active" : "Inactive"}</Label>
        <div className="flex-1" />
        {block?.id && onDelete && (
          !confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-destructive hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete this block
            </button>
          ) : (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-destructive/10 rounded-md border border-destructive/30">
              <span className="text-xs text-destructive font-medium">Are you sure?</span>
              <button onClick={() => onDelete(block.id)} className="text-xs font-semibold text-destructive hover:underline">Yes, delete</button>
              <button onClick={() => setConfirmDelete(false)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
            </div>
          )
        )}
      </div>


      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1">
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
}