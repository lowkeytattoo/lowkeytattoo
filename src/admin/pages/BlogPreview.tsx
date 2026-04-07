import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBlogPosts } from "@admin/hooks/useBlogPosts";

export default function BlogPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: posts, isLoading } = useBlogPosts();

  const post = posts?.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm font-mono">
        Cargando...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-muted-foreground text-sm">Post no encontrado.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al blog
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/blog")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
        <div className="flex items-center gap-3">
          <Badge
            variant={post.published ? "default" : "outline"}
            className="text-[10px] font-mono uppercase tracking-wider"
          >
            {post.published ? "Publicado" : "Borrador"}
          </Badge>
          {post.published && (
            <a
              href={`/blog/${post.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Ver en web
            </a>
          )}
        </div>
      </div>

      {/* Preview notice */}
      <div className="mb-6 px-4 py-2.5 rounded-md bg-muted/40 border border-border">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Vista previa — /blog/{post.slug}
        </p>
      </div>

      {/* Article header */}
      <header className="mb-8">
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">{post.title}</h1>
        <p className="text-sm text-muted-foreground font-mono">
          {format(new Date(post.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
        {post.excerpt && (
          <p className="mt-4 text-muted-foreground leading-relaxed border-l-2 border-primary pl-4">
            {post.excerpt}
          </p>
        )}
      </header>

      {/* Article content — same prose styling as BlogPostPage */}
      <article
        className="
          [&_p]:text-muted-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_p]:text-justify
          [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-10 [&_h2]:mb-4
          [&_h3]:text-foreground [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-2
          [&_ul]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1
          [&_ol]:text-muted-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1
          [&_img]:rounded-lg [&_img]:max-w-full [&_img]:my-6 [&_img]:mx-auto [&_img]:block
          [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
          [&_strong]:text-foreground [&_strong]:font-semibold
          [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_blockquote]:italic [&_blockquote]:my-4
        "
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  );
}
