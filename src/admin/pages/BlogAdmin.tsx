import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus, Pencil, Trash2, Eye, EyeOff, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RichTextEditor } from "@admin/components/RichTextEditor";
import { DatePickerInput } from "@admin/components/DatePickerInput";
import {
  useBlogPosts,
  useCreateBlogPost,
  useUpdateBlogPost,
  useDeleteBlogPost,
  uploadBlogImage,
  type BlogPostRow,
} from "@admin/hooks/useBlogPosts";
import { cn } from "@shared/lib/utils";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

interface PostForm {
  title: string;
  slug: string;
  meta_description: string;
  excerpt: string;
  cover_image: string;
  content: string;
  tags: string;
  published: boolean;
  date: string;
}

const EMPTY_FORM: PostForm = {
  title: "",
  slug: "",
  meta_description: "",
  excerpt: "",
  cover_image: "",
  content: "",
  tags: "",
  published: true,
  date: new Date().toISOString().split("T")[0],
};

export default function BlogAdmin() {
  const { data: posts, isLoading } = useBlogPosts();
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost();
  const deletePost = useDeleteBlogPost();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPostRow | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const openCreate = () => {
    setEditingPost(null);
    setForm(EMPTY_FORM);
    setSlugManuallyEdited(false);
    setSlugError(null);
    setCoverError(null);
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPostRow) => {
    setEditingPost(post);
    setForm({
      title: post.title,
      slug: post.slug,
      meta_description: post.meta_description ?? "",
      excerpt: post.excerpt ?? "",
      cover_image: post.cover_image ?? "",
      content: post.content,
      tags: post.tags.join(", "),
      published: post.published,
      date: post.date,
    });
    setSlugManuallyEdited(true);
    setSlugError(null);
    setCoverError(null);
    setEditorOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    setCoverError(null);
    try {
      const url = await uploadBlogImage(file);
      setForm((f) => ({ ...f, cover_image: url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCoverError(msg || "Error al subir la imagen.");
    } finally {
      setCoverUploading(false);
      e.target.value = "";
    }
  };

  const handleTitleChange = (value: string) => {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugManuallyEdited ? f.slug : slugify(value),
    }));
    setSlugError(null);
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    setForm((f) => ({ ...f, slug: value }));
    setSlugError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Duplicate slug check
    const duplicate = posts?.find(
      (p) => p.slug === form.slug && p.id !== editingPost?.id
    );
    if (duplicate) {
      setSlugError(`El slug "${form.slug}" ya está en uso. Elige uno diferente.`);
      return;
    }

    const payload = {
      title: form.title,
      slug: form.slug,
      meta_description: form.meta_description || null,
      excerpt: form.excerpt || null,
      cover_image: form.cover_image || null,
      content: form.content,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      published: form.published,
      date: form.date,
    };
    if (editingPost) {
      await updatePost.mutateAsync({ id: editingPost.id, ...payload });
    } else {
      await createPost.mutateAsync(payload);
    }
    setEditorOpen(false);
  };

  const handleTogglePublished = (post: BlogPostRow) => {
    updatePost.mutate({ id: post.id, published: !post.published });
  };

  const isPending = createPost.isPending || updatePost.isPending;
  const metaLen = form.meta_description.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {posts?.filter((p) => p.published).length ?? 0} publicados ·{" "}
            {posts?.filter((p) => !p.published).length ?? 0} borradores
          </p>
        </div>
        <Button onClick={openCreate} className="cta-button gap-2">
          <Plus className="w-4 h-4" />
          Nuevo post
        </Button>
      </div>

      {/* Posts list */}
      <div className="rounded-lg border border-border overflow-hidden bg-card divide-y divide-border">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Cargando...</div>
        ) : !posts?.length ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            No hay posts. Crea el primero.
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="flex items-start justify-between gap-4 p-4 hover:bg-muted/20 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-foreground truncate">{post.title}</span>
                  <Badge
                    variant={post.published ? "default" : "outline"}
                    className="text-[10px] font-mono uppercase tracking-wider shrink-0"
                  >
                    {post.published ? "Publicado" : "Borrador"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>{format(new Date(post.date), "d MMM yyyy", { locale: es })}</span>
                  <span className="opacity-50">/blog/{post.slug}</span>
                </div>
                {post.excerpt && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{post.excerpt}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Preview */}
                <a
                  href={`/admin/blog/preview/${post.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Vista previa"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <MonitorPlay className="w-4 h-4" />
                </a>
                {/* Publish toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  title={post.published ? "Despublicar" : "Publicar"}
                  onClick={() => handleTogglePublished(post)}
                >
                  {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {/* Edit */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  title="Editar"
                  onClick={() => openEdit(post)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-destructive hover:text-destructive"
                  title="Eliminar"
                  onClick={() => setDeleteId(post.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={(o) => !isPending && setEditorOpen(o)}>
        <DialogContent className="bg-card border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPost ? "Editar post" : "Nuevo post"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 mt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">Título *</Label>
              <Input
                value={form.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Estilos de tatuaje: guía completa..."
                required
                className="bg-background border-border text-base"
              />
            </div>

            {/* Slug + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Slug (URL) *</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="estilos-de-tatuaje-guia-completa"
                  required
                  className={cn(
                    "bg-background border-border font-mono text-sm",
                    slugError && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                {slugError ? (
                  <p className="text-[10px] text-destructive font-mono">{slugError}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground font-mono">/blog/{form.slug || "..."}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="font-mono text-xs uppercase tracking-wider">Fecha de publicación *</Label>
                <DatePickerInput
                  value={form.date}
                  onChange={(v) => setForm((f) => ({ ...f, date: v }))}
                  required
                />
              </div>
            </div>

            {/* Meta description */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">
                Meta descripción <span className="text-muted-foreground">(SEO, ~155 caracteres)</span>
              </Label>
              <Textarea
                value={form.meta_description}
                onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                placeholder="Descubre todos los estilos de tatuaje..."
                rows={2}
                className="bg-background border-border resize-none"
              />
              <p className={cn(
                "text-[10px] font-mono text-right",
                metaLen > 155 ? "text-destructive font-semibold" : "text-muted-foreground"
              )}>
                {metaLen}/155
              </p>
            </div>

            {/* Excerpt */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">
                Extracto <span className="text-muted-foreground">(preview en listado del blog)</span>
              </Label>
              <Textarea
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                placeholder="Una breve descripción del artículo..."
                rows={2}
                className="bg-background border-border resize-none"
              />
            </div>

            {/* Cover image */}
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">
                Imagen de cabecera <span className="text-muted-foreground">(opcional)</span>
              </Label>
              {form.cover_image ? (
                <div className="relative rounded-md overflow-hidden">
                  <img
                    src={form.cover_image}
                    alt="Vista previa"
                    className="w-full aspect-[16/6] object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, cover_image: "" }))}
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-sm px-2 py-1 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={form.cover_image}
                    onChange={(e) => setForm((f) => ({ ...f, cover_image: e.target.value }))}
                    placeholder="Pega una URL o sube un archivo →"
                    className="bg-background border-border text-sm"
                  />
                  <label className={cn(
                    "cursor-pointer inline-flex items-center whitespace-nowrap border border-border rounded-sm px-3 text-xs font-mono shrink-0 transition-colors",
                    coverUploading
                      ? "opacity-50 pointer-events-none text-muted-foreground"
                      : "text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  )}>
                    {coverUploading ? "Subiendo..." : "Subir archivo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      disabled={coverUploading}
                      onChange={handleCoverUpload}
                    />
                  </label>
                </div>
              )}
              {coverError && (
                <p className="text-[10px] text-destructive font-mono">{coverError}</p>
              )}
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">
                Tags <span className="text-muted-foreground">(separados por coma)</span>
              </Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="estilos, guía, fine line"
                className="bg-background border-border"
              />
            </div>

            {/* Content editor */}
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider">Contenido *</Label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((f) => ({ ...f, content: html }))}
              />
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              <Label htmlFor="published" className="cursor-pointer text-sm">
                Publicar inmediatamente
              </Label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditorOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" className="cta-button" disabled={isPending}>
                {isPending ? "Guardando..." : editingPost ? "Guardar cambios" : "Crear post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El post se eliminará permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteId) deletePost.mutate(deleteId); setDeleteId(null); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
