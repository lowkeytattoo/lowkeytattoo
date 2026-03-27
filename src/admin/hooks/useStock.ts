import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@shared/lib/supabase";
import type { Product, StockMovement } from "@shared/types/index";

export const useProducts = (category?: string) => {
  return useQuery({
    queryKey: ["products", category],
    queryFn: async () => {
      let query = supabase.from("products").select("*").order("name");
      if (category) query = query.eq("category", category);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useLowStockCount = () => {
  return useQuery({
    queryKey: ["low-stock-count"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("quantity, min_quantity");
      if (error) throw error;
      return (data ?? []).filter((p) => p.quantity <= p.min_quantity).length;
    },
    refetchInterval: 60_000,
  });
};

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: Omit<Product, "id" | "created_at">) => {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-count"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-count"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-count"] });
    },
  });
};

export const useStockMovements = (productId: string) => {
  return useQuery({
    queryKey: ["stock-movements", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_movements")
        .select("*, created_by_profile:profiles(display_name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!productId,
  });
};

export const useCreateStockMovement = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (movement: Omit<StockMovement, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("stock_movements")
        .insert(movement)
        .select()
        .single();
      if (error) throw error;

      // Update product quantity
      const { data: product } = await supabase
        .from("products")
        .select("quantity")
        .eq("id", movement.product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({ quantity: product.quantity + movement.quantity_change })
          .eq("id", movement.product_id);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock-movements", variables.product_id] });
      qc.invalidateQueries({ queryKey: ["low-stock-count"] });
    },
  });
};
