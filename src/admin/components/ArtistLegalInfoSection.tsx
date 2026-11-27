import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useArtistLegalInfo, useSaveArtistLegalInfo } from "@admin/hooks/useArtistLegalInfo";

/**
 * "Datos legales para consentimientos": DNI/NIE y nº de certificado
 * higiénico-sanitario del artista. Aparecen en cada consentimiento que firma.
 * Se usa en "Mi perfil" (cada artista lo suyo) y en "Editar artista" (dueños).
 */
export const ArtistLegalInfoSection = ({ profileId }: { profileId: string }) => {
  const { data, isLoading } = useArtistLegalInfo(profileId);
  const save = useSaveArtistLegalInfo();
  const [nif, setNif] = useState("");
  const [cert, setCert] = useState("");

  useEffect(() => {
    setNif(data?.nif ?? "");
    setCert(data?.sanitary_cert ?? "");
  }, [data, profileId]);

  const dirty = nif.trim().toUpperCase() !== (data?.nif ?? "") || cert.trim() !== (data?.sanitary_cert ?? "");
  const nifInvalid = nif.trim().length > 0 && (nif.trim().length < 5 || nif.trim().length > 20);

  const onSave = async () => {
    try {
      await save.mutateAsync({ profileId, nif, sanitaryCert: cert });
      toast.success("Datos legales guardados");
    } catch (err) {
      toast.error(`No se pudieron guardar: ${(err as Error).message}`);
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div>
        <p className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider text-foreground">
          Datos legales para consentimientos
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Aparecen como aplicador en cada consentimiento que firmes. Solo los ves tú y los dueños del estudio.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">DNI / NIE</Label>
        <Input
          value={nif}
          onChange={(e) => setNif(e.target.value.toUpperCase())}
          placeholder={isLoading ? "Cargando…" : "12345678A"}
          maxLength={20}
          className="bg-background border-border uppercase font-mono"
        />
        {nifInvalid && <p className="text-xs text-destructive">Entre 5 y 20 caracteres.</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="font-['IBM_Plex_Mono'] text-xs uppercase tracking-wider">
          Nº certificado higiénico-sanitario
        </Label>
        <Input
          value={cert}
          onChange={(e) => setCert(e.target.value)}
          placeholder={isLoading ? "Cargando…" : "Número o referencia del certificado"}
          maxLength={80}
          className="bg-background border-border"
        />
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onSave}
        disabled={!dirty || nifInvalid || save.isPending || isLoading}
      >
        {save.isPending ? "Guardando…" : "Guardar datos legales"}
      </Button>
    </div>
  );
};
