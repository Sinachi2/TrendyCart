import { useState } from "react";
import { Share2, Copy, Check, Link as LinkIcon, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface WishlistShareProps {
  wishlistItemCount: number;
}

const WishlistShare = ({ wishlistItemCount }: WishlistShareProps) => {
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Generate a shareable link with the user's ID
  const shareableLink = user
    ? `${window.location.origin}/wishlist/shared/${user.id}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with friends to show them your wishlist.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const shareOnSocial = (platform: "facebook" | "twitter") => {
    const text = `Check out my wishlist on TrendyCart! ${wishlistItemCount} amazing items I'd love to have.`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareableLink);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    };

    window.open(urls[platform], "_blank", "width=600,height=400");
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Share Wishlist
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Wishlist</DialogTitle>
          <DialogDescription>
            Share your wishlist with friends and family so they know what you'd love to receive!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share Link</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={shareableLink}
                  readOnly
                  className="pl-10 pr-4"
                />
              </div>
              <Button onClick={handleCopy} variant="secondary" size="icon">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Share */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Share on Social Media</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => shareOnSocial("facebook")}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => shareOnSocial("twitter")}
              >
                <Twitter className="h-4 w-4 text-sky-500" />
                Twitter
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
            <p>
              📝 Your wishlist contains <strong>{wishlistItemCount}</strong> items.
              Anyone with this link can view your wishlist.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WishlistShare;
