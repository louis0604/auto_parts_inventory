import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type ImageUploadProps = {
  value?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
};

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | undefined>(value);

  const uploadMutation = trpc.storage.uploadImage.useMutation({
    onSuccess: (data: { url: string; key: string }) => {
      setPreview(data.url);
      onChange(data.url);
      toast.success("图片上传成功");
      setUploading(false);
    },
    onError: (error: any) => {
      toast.error(`上传失败: ${error.message}`);
      setUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("图片大小不能超过5MB");
      return;
    }

    setUploading(true);

    // 转换为base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadMutation.mutate({
        fileName: file.name,
        fileData: base64,
        contentType: file.type,
      });
    };
    reader.onerror = () => {
      toast.error("读取文件失败");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(undefined);
    onChange(undefined);
    toast.success("图片已移除");
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="relative border border-gray-300 rounded overflow-hidden bg-gray-50">
          <img
            src={preview}
            alt="Part preview"
            className="w-full h-48 object-contain"
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center bg-gray-50">
          <ImageIcon className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-3">
            {uploading ? "上传中..." : "点击上传配件图片"}
          </p>
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                选择图片
              </span>
            </Button>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || uploading}
          />
          <p className="text-xs text-gray-500 mt-2">
            支持 JPG、PNG、GIF，最大5MB
          </p>
        </div>
      )}
    </div>
  );
}
