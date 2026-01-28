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
import { AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  relatedItems?: { label: string; count: number }[];
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  relatedItems,
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              {itemName && (
                <p className="text-sm text-muted-foreground mt-1">
                  {itemName}
                </p>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogDescription className="space-y-3">
          <p>{description}</p>
          
          {relatedItems && relatedItems.length > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                将同时删除以下关联数据：
              </p>
              <ul className="space-y-1">
                {relatedItems.map((item, index) => (
                  <li key={index} className="text-sm flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <span>{item.label}：</span>
                    <span className="font-semibold text-red-600">{item.count} 条</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <p className="text-sm font-semibold text-destructive">
            ⚠️ 此操作无法撤销，请谨慎操作！
          </p>
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "删除中..." : "确认删除"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
