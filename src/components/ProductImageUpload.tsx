import { useState } from "react";
import { Upload, X, GripVertical, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductImage {
  id?: string;
  image_url: string;
  display_order: number;
}

interface ProductImageUploadProps {
  productId?: string;
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export const ProductImageUpload = ({ productId, images, onChange }: ProductImageUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      const newImage: ProductImage = {
        image_url: publicUrl,
        display_order: images.length,
      };

      onChange([...images, newImage]);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddUrl = () => {
    if (!imageUrl.trim()) return;

    const newImage: ProductImage = {
      image_url: imageUrl.trim(),
      display_order: images.length,
    };

    onChange([...images, newImage]);
    setImageUrl("");
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    // Update display order
    onChange(newImages.map((img, i) => ({ ...img, display_order: i })));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    
    // Update display order
    onChange(newImages.map((img, i) => ({ ...img, display_order: i })));
  };

  return (
    <div className="space-y-4">
      <Label>Product Images</Label>
      
      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group aspect-square bg-muted rounded-lg overflow-hidden border border-border"
            >
              <img
                src={image.image_url}
                alt={`Product image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {index > 0 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => moveImage(index, index - 1)}
                  >
                    ←
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => moveImage(index, index + 1)}
                  >
                    →
                  </Button>
                )}
              </div>
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Options */}
      <div className="space-y-3">
        {/* File Upload */}
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <Label
            htmlFor="image-upload"
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors"
          >
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Image"}
          </Label>
        </div>

        {/* URL Input */}
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Or paste image URL..."
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Button type="button" variant="outline" onClick={handleAddUrl}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {images.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No images added yet. Upload or paste URLs to add product images.
        </p>
      )}
    </div>
  );
};