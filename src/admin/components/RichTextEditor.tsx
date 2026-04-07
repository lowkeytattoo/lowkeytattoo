import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import { uploadBlogImage } from "@admin/hooks/useBlogPosts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bold, Italic, Strikethrough,
  Heading2, Heading3,
  List, ListOrdered,
  Link2, Image as ImageIcon,
  AlignLeft, AlignCenter, AlignJustify,
  Undo, Redo,
} from "lucide-react";
import { cn } from "@shared/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

type ImageTab = "upload" | "url";

export function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [imageOpen, setImageOpen] = useState(false);
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Empieza a escribir el artículo..." }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const ToolBtn = ({
    onClick,
    active,
    disabled,
    title,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-primary/20 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
        disabled && "opacity-30 pointer-events-none"
      )}
    >
      {children}
    </button>
  );

  const resetImageDialog = () => {
    setImageUrl("");
    setImageAlt("");
    setImageOpen(false);
  };

  const insertImageUrl = () => {
    if (!imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl.trim(), alt: imageAlt.trim() }).run();
    resetImageDialog();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url, alt: imageAlt.trim() }).run();
      resetImageDialog();
    } catch (err) {
      console.error("Error uploading image:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-card">
        <ToolBtn title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Tachado" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolBtn title="Título H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Título H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolBtn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolBtn title="Alinear izquierda" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Centrar" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Justificar" active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
          <AlignJustify className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolBtn
          title="Enlace"
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("URL del enlace:", editor.getAttributes("link").href ?? "https://");
            if (url === null) return;
            if (url === "") { editor.chain().focus().unsetLink().run(); return; }
            editor.chain().focus().setLink({ href: url }).run();
          }}
        >
          <Link2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Imagen" onClick={() => setImageOpen(true)}>
          <ImageIcon className="w-4 h-4" />
        </ToolBtn>

        <span className="w-px h-5 bg-border mx-1" />

        <ToolBtn title="Deshacer" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Rehacer" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent
        editor={editor}
        className="min-h-[320px] px-4 py-3 prose prose-invert prose-sm max-w-none
          focus-within:outline-none
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror]:min-h-[300px]
          [&_.ProseMirror_p]:text-muted-foreground
          [&_.ProseMirror_p]:leading-relaxed
          [&_.ProseMirror_p]:mb-4
          [&_.ProseMirror_h2]:text-foreground
          [&_.ProseMirror_h2]:text-xl
          [&_.ProseMirror_h2]:font-medium
          [&_.ProseMirror_h2]:mt-8
          [&_.ProseMirror_h2]:mb-3
          [&_.ProseMirror_h3]:text-foreground
          [&_.ProseMirror_h3]:text-base
          [&_.ProseMirror_h3]:font-medium
          [&_.ProseMirror_h3]:mt-5
          [&_.ProseMirror_h3]:mb-2
          [&_.ProseMirror_ul]:text-muted-foreground
          [&_.ProseMirror_ol]:text-muted-foreground
          [&_.ProseMirror_img]:rounded-lg
          [&_.ProseMirror_img]:max-w-full
          [&_.ProseMirror_img]:my-4
          [&_.ProseMirror_a]:text-primary
          [&_.ProseMirror_a]:underline
          [&_.ProseMirror_strong]:text-foreground
          [&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_.is-editor-empty:first-child::before]:text-muted-foreground/40
          [&_.ProseMirror_.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_.is-editor-empty:first-child::before]:h-0"
      />

      {/* Image dialog */}
      <Dialog open={imageOpen} onOpenChange={(o) => { if (!o) resetImageDialog(); else setImageOpen(true); }}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar imagen</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["upload", "url"] as ImageTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setImageTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors",
                  imageTab === tab
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "upload" ? "Subir archivo" : "URL externa"}
              </button>
            ))}
          </div>

          <div className="pt-2 space-y-4">
            {/* Alt text — shared between both tabs */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">
                Texto alternativo <span className="text-muted-foreground">(alt)</span>
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                placeholder="Descripción de la imagen para accesibilidad y SEO"
                className="bg-background border-border"
              />
              <p className="text-[10px] text-muted-foreground font-mono">
                Describe lo que muestra la imagen. Importante para SEO y accesibilidad.
              </p>
            </div>

            {imageTab === "upload" ? (
              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-wider">Archivo de imagen</Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={!imageAlt.trim()}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                    file:text-xs file:font-mono file:uppercase file:tracking-wider
                    file:bg-muted file:text-foreground hover:file:bg-muted/80 cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!imageAlt.trim() && (
                  <p className="text-[10px] text-muted-foreground/60 font-mono">
                    Introduce el texto alternativo antes de subir la imagen.
                  </p>
                )}
                {uploading && (
                  <p className="text-xs text-muted-foreground font-mono animate-pulse">Subiendo imagen...</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="font-mono text-xs uppercase tracking-wider">URL de la imagen</Label>
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="bg-background border-border"
                  onKeyDown={(e) => e.key === "Enter" && insertImageUrl()}
                />
                <Button
                  type="button"
                  className="w-full cta-button"
                  onClick={insertImageUrl}
                  disabled={!imageUrl.trim() || !imageAlt.trim()}
                >
                  Insertar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
