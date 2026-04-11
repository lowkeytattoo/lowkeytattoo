import { useState } from "react";
import { toast } from "sonner";
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useStockMovements,
  useCreateStockMovement,
} from "@admin/hooks/useStock";
import { useAdminAuth } from "@admin/contexts/AdminAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, History, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { Product, ProductCategory } from "@shared/types/index";

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: "tinta", label: "Tinta" },
  { value: "aguja", label: "Agujas" },
  { value: "piercing_joyeria", label: "Joyería piercing" },
  { value: "cuidado", label: "Cuidado" },
  { value: "higiene", label: "Higiene" },
  { value: "equipo", label: "Equipo" },
  { value: "otro", label: "Otro" },
];

function stockStatus(quantity: number, min: number) {
  if (quantity <= 0) return { color: "bg-destructive", label: "Agotado", variant: "destructive" as const };
  if (quantity <= min) return { color: "bg-yellow-500", label: "Bajo", variant: "destructive" as const };
  return { color: "bg-primary", label: "OK", variant: "default" as const };
}

function stockPercent(quantity: number, min: number) {
  if (min <= 0) return quantity > 0 ? 100 : 0;
  return Math.min(100, (quantity / (min * 2)) * 100);
}

export default function Stock() {
  const { profile } = useAdminAuth();
  const isOwner = profile?.role === "owner";

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showHistory, setShowHistory] = useState<Product | null>(null);
  const [showUsage, setShowUsage] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const { data: products, isLoading } = useProducts(filterCategory !== "all" ? filterCategory : undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createMovement = useCreateStockMovement();
  const { data: movements } = useStockMovements(showHistory?.id ?? "");

  const [formName, setFormName] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCategory, setFormCategory] = useState<ProductCategory>("tinta");
  const [formQty, setFormQty] = useState("");
  const [formMinQty, setFormMinQty] = useState("");
  const [formUnit, setFormUnit] = useState("ud");
  const [formPrice, setFormPrice] = useState("");

  const [usageAmount, setUsageAmount] = useState("");
  const [usageNotes, setUsageNotes] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct.mutateAsync({
        name: formName,
        brand: formBrand || null,
        category: formCategory,
        quantity: parseFloat(formQty) || 0,
        min_quantity: parseFloat(formMinQty) || 0,
        unit: formUnit || "ud",
        price_per_unit: formPrice ? parseFloat(formPrice) : null,
        notes: null,
      });
      setShowCreate(false);
      setFormName(""); setFormBrand(""); setFormQty(""); setFormMinQty(""); setFormPrice("");
    } catch {
      toast.error("Error al crear el producto. Inténtalo de nuevo.");
    }
  };

  const handleUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showUsage) return;
    try {
      await createMovement.mutateAsync({
        product_id: showUsage.id,
        quantity_change: -(parseFloat(usageAmount) || 0),
        type: "salida",
        notes: usageNotes || null,
        created_by: profile?.id ?? null,
      });
      setShowUsage(null);
      setUsageAmount("");
      setUsageNotes("");
    } catch {
      toast.error("Error al registrar el uso. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock</h1>
          <p className="text-muted-foreground text-sm mt-1">{(products ?? []).length} productos</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowCreate(true)} className="cta-button gap-2">
            <Plus className="w-4 h-4" />
            Nuevo producto
          </Button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterCategory === "all" ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => setFilterCategory("all")}
        >
          Todos
        </Button>
        {CATEGORIES.map(({ value, label }) => (
          <Button
            key={value}
            variant={filterCategory === value ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setFilterCategory(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Products grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : (products ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Sin productos</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(products ?? []).map((product) => {
            const status = stockStatus(product.quantity, product.min_quantity);
            const percent = stockPercent(product.quantity, product.min_quantity);
            return (
              <Card key={product.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{product.name}</div>
                      {product.brand && (
                        <div className="text-xs text-muted-foreground">{product.brand}</div>
                      )}
                    </div>
                    <Badge variant={status.variant} className="text-xs shrink-0">
                      {status.label}
                    </Badge>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="font-['IBM_Plex_Mono']">
                        {product.quantity} {product.unit}
                      </span>
                      <span>mín: {product.min_quantity} {product.unit}</span>
                    </div>
                    <Progress
                      value={percent}
                      className="h-1.5"
                    />
                  </div>

                  {product.category && (
                    <Badge variant="outline" className="text-xs font-['IBM_Plex_Mono']">
                      {CATEGORIES.find((c) => c.value === product.category)?.label ?? product.category}
                    </Badge>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs gap-1"
                      onClick={() => setShowUsage(product)}
                    >
                      <Plus className="w-3 h-3" />
                      Registrar uso
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs gap-1"
                      onClick={() => setShowHistory(product)}
                    >
                      <History className="w-3 h-3" />
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create product dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Nombre *</Label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} required className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Marca</Label>
                <Input value={formBrand} onChange={(e) => setFormBrand(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Categoría</Label>
                <Select value={formCategory} onValueChange={(v) => setFormCategory(v as ProductCategory)}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Cantidad inicial</Label>
                <Input type="number" min="0" step="0.001" value={formQty} onChange={(e) => setFormQty(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Mínimo</Label>
                <Input type="number" min="0" step="0.001" value={formMinQty} onChange={(e) => setFormMinQty(e.target.value)} className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Unidad</Label>
                <Input value={formUnit} onChange={(e) => setFormUnit(e.target.value)} placeholder="ud" className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Precio/unidad (€)</Label>
                <Input type="number" min="0" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} className="bg-background border-border" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" className="cta-button" disabled={createProduct.isPending}>
                {createProduct.isPending ? "Guardando..." : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Usage dialog */}
      <Dialog open={!!showUsage} onOpenChange={(open) => !open && setShowUsage(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Registrar uso — {showUsage?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUsage} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
                Cantidad usada ({showUsage?.unit}) *
              </Label>
              <Input
                type="number"
                min="0.001"
                step="0.001"
                value={usageAmount}
                onChange={(e) => setUsageAmount(e.target.value)}
                required
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">Notas</Label>
              <Textarea value={usageNotes} onChange={(e) => setUsageNotes(e.target.value)} className="bg-background border-border" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowUsage(null)}>Cancelar</Button>
              <Button type="submit" className="cta-button" disabled={createMovement.isPending}>
                {createMovement.isPending ? "Guardando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!showHistory} onOpenChange={(open) => !open && setShowHistory(null)}>
        <DialogContent className="bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Historial — {showHistory?.name}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            {!movements || movements.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Sin movimientos</p>
            ) : (
              movements.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div className="text-xs font-['IBM_Plex_Mono'] text-muted-foreground w-24 shrink-0">
                    {format(new Date(m.created_at), "d MMM yyyy", { locale: es })}
                  </div>
                  <Badge
                    variant={m.type === "entrada" ? "default" : "outline"}
                    className="text-xs font-['IBM_Plex_Mono'] shrink-0"
                  >
                    {m.type}
                  </Badge>
                  <div className={`font-['IBM_Plex_Mono'] text-sm ml-auto ${m.quantity_change > 0 ? "text-primary" : "text-destructive"}`}>
                    {m.quantity_change > 0 ? "+" : ""}{m.quantity_change}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar <strong>{deleteTarget?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) deleteProduct.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
