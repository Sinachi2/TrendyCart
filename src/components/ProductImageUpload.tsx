import { useState, useCallback } from "react";
import { Upload, X, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
  file?: File;
  isNew?: boolean;
}

interface ProductImageUploadProps {
  productId?: string;
  images: ProductImage[];
  onImagesChange: (images: ProductImage[]) => void;
  maxImages?: number;
}

export const ProductImageUpload = ({
  productId,
  images,
  onImagesChange,
  maxImages = 5,
}: ProductImageUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (files.length === 0) {
        toast({
          title: "Invalid files",
          description: "Please drop image files only",
          variant: "destructive",
        });
        return;
      }

      await processFiles(files);
    },
    [images, maxImages]
  );

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = "";
  };

  const processFiles = async (files: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (files.length > remainingSlots) {
      toast({
        title: "Too many images",
        description: `Only ${remainingSlots} more image(s) can be added`,
        variant: "destructive",
      });
    }

    setUploading(true);

    try {
      const newImages: ProductImage[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${productId || "temp"}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);

        newImages.push({
          image_url: urlData.publicUrl,
          display_order: images.length + i,
          isNew: true,
        });
      }

      onImagesChange([...images, ...newImages]);

      toast({
        title: "Success",
        description: `${newImages.length} image(s) uploaded successfully`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Update display order
    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      display_order: i,
    }));
    onImagesChange(reorderedImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);

    const reorderedImages = newImages.map((img, i) => ({
      ...img,
      display_order: i,
    }));
    onImagesChange(reorderedImages);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          uploading && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {uploading ? "Uploading..." : "Drag & drop images here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse • PNG, JPG up to 5MB
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="image-upload"
            disabled={uploading || images.length >= maxImages}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("image-upload")?.click()}
            disabled={uploading || images.length >= maxImages}
            className="mt-2"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Browse Files
          </Button>
          <p className="text-xs text-muted-foreground">
            {images.length}/{maxImages} images
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((image, index) => (
            <div
              key={image.id || index}
              className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
            >
              <img
                src={image.image_url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Order badge */}
              <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-background/90 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => moveImage(index, index - 1)}
                  disabled={index === 0}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeImage(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Primary badge for first image */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                    Primary
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;
