import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LineCodeSelectorProps {
  sku: string;
  onSelect: (partId: number, lineCode: string) => void;
  open: boolean;
  onClose: () => void;
}

export function LineCodeSelector({ sku, onSelect, open, onClose }: LineCodeSelectorProps) {
  const { data: lineCodes, isLoading } = trpc.parts.getLineCodesBySku.useQuery(sku, {
    enabled: open && !!sku,
  });

  useEffect(() => {
    if (open && lineCodes && lineCodes.length === 1) {
      // 如果只有一个Line Code，自动选择
      onSelect(lineCodes[0].partId, lineCodes[0].lineCode);
      onClose();
    }
  }, [open, lineCodes, onSelect, onClose]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>选择 Line Code</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            配件号 <span className="font-mono font-semibold">{sku}</span> 对应多个 Line Code，请选择：
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : lineCodes && lineCodes.length > 0 ? (
            <div className="space-y-2">
              {lineCodes.map((item) => (
                <Button
                  key={item.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4"
                  onClick={() => {
                    onSelect(item.partId, item.lineCode);
                    onClose();
                    toast.success(`已选择 Line Code: ${item.lineCode}`);
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <div className="font-mono font-semibold text-lg">{item.lineCode}</div>
                    <div className="text-sm text-muted-foreground">{item.partName}</div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              没有找到对应的 Line Code
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
