import ReactQuill, { Quill } from "react-quill";
import { useRef } from "react";

// Register size attributor so font size formats actually apply
const Size = Quill.import("attributors/style/size");
Size.whitelist = ["10px", "12px", "14px", "16px", "20px", "24px", "32px"];
Quill.register(Size, true);

const ToolbarButton = ({ onClick, children, title }) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => {
      e.preventDefault(); // keeps editor focus/selection
      onClick();
    }}
    className="px-2 py-1 text-sm rounded border transition-colors select-none bg-white text-foreground border-border hover:bg-accent"
  >
    {children}
  </button>
);

export default function RichTextEditor({ value, onChange }) {
  const quillRef = useRef(null);
  const savedRange = useRef(null);

  const getQuill = () => quillRef.current?.getEditor();

  const handleSelectionChange = (range) => {
    if (range !== null) savedRange.current = range;
  };

  // Apply inline format (bold, italic) — uses formatText for range, format for cursor
  const toggleInline = (format) => {
    const quill = getQuill();
    if (!quill) return;
    const range = savedRange.current || quill.getSelection();
    if (!range) return;
    const current = quill.getFormat(range.index, range.length);
    if (range.length > 0) {
      quill.formatText(range.index, range.length, format, !current[format]);
    } else {
      quill.format(format, !current[format]);
    }
  };

  // Apply block/line format (list, size, indent)
  const applyBlockFormat = (format, value) => {
    const quill = getQuill();
    if (!quill) return;
    const range = savedRange.current || quill.getSelection();
    if (!range) return;
    quill.setSelection(range.index, range.length);
    quill.format(format, value);
  };

  const setSize = (size) => applyBlockFormat("size", size || false);

  const setList = (type) => {
    const quill = getQuill();
    if (!quill) return;
    const range = savedRange.current || quill.getSelection();
    if (!range) return;
    const current = quill.getFormat(range.index, range.length);
    quill.setSelection(range.index, range.length);
    quill.format("list", current.list === type ? false : type);
  };

  const indent = () => {
    const quill = getQuill();
    if (!quill) return;
    const range = savedRange.current || quill.getSelection();
    if (!range) return;
    const current = quill.getFormat(range.index, range.length);
    quill.setSelection(range.index, range.length);
    quill.format("indent", (current.indent || 0) + 1);
  };

  const outdent = () => {
    const quill = getQuill();
    if (!quill) return;
    const range = savedRange.current || quill.getSelection();
    if (!range) return;
    const current = quill.getFormat(range.index, range.length);
    const next = (current.indent || 0) - 1;
    quill.setSelection(range.index, range.length);
    quill.format("indent", next > 0 ? next : false);
  };

  return (
    <div>
      <div className="sticky top-0 z-20 flex flex-wrap gap-1.5 p-2 bg-white border border-b-0 border-border rounded-t-md shadow-sm">
        <ToolbarButton onClick={() => toggleInline("bold")} title="Bold">
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleInline("italic")} title="Italic">
          <em>I</em>
        </ToolbarButton>

        <div className="w-px bg-border mx-0.5" />

        <ToolbarButton onClick={() => setSize("12px")} title="Small text">
          <span className="text-xs">A</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => setSize(false)} title="Normal text">
          <span className="text-sm">A</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => setSize("20px")} title="Large text">
          <span className="text-base font-medium">A</span>
        </ToolbarButton>
        <ToolbarButton onClick={() => setSize("24px")} title="Huge text">
          <span className="text-lg font-bold">A</span>
        </ToolbarButton>

        <div className="w-px bg-border mx-0.5" />

        <ToolbarButton onClick={() => setList("ordered")} title="Numbered list">
          1≡
        </ToolbarButton>
        <ToolbarButton onClick={() => setList("bullet")} title="Bullet list">
          •≡
        </ToolbarButton>

        <div className="w-px bg-border mx-0.5" />

        <ToolbarButton onClick={indent} title="Indent">
          →|
        </ToolbarButton>
        <ToolbarButton onClick={outdent} title="Outdent">
          |←
        </ToolbarButton>
      </div>

      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        onChangeSelection={handleSelectionChange}
        theme="snow"
        modules={{ toolbar: false }}
        className="[&_.ql-toolbar]:hidden [&_.ql-container]:rounded-b-md [&_.ql-editor]:min-h-[180px] [&_.ql-editor]:text-sm"
      />
    </div>
  );
}