import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useRef } from "react";
import { Upload, Image, Smile, MapPin, X } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User } from "@shared/schema";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User;
}

export default function CreatePostModal({ isOpen, onClose, user }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [postType, setPostType] = useState<string>("text");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPostMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`${response.status}: ${error}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Post created successfully!",
        description: `You earned ${data.coinsEarned} AC for sharing content`,
      });
      handleClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Determine post type based on file type
      if (file.type.startsWith('image/')) {
        setPostType('photo');
      } else if (file.type.startsWith('video/')) {
        setPostType('video');
      }
    }
  };

  const handleSubmit = () => {
    if (!content.trim() && !selectedFile) {
      toast({
        title: "Error",
        description: "Please add some content or select a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('content', content);
    formData.append('postType', postType);
    
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    createPostMutation.mutate(formData);
  };

  const handleClose = () => {
    setContent("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setPostType("text");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onClose();
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setPostType("text");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create Post & Earn Ahmiyat Coins
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <img 
              src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"}
              alt="User Profile" 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-[hsl(214,8%,40%)]">Public • Earn AC for every interaction</p>
            </div>
          </div>
          
          <Textarea
            placeholder="What's happening? Share your thoughts, memes, or memories..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-24 border-none resize-none text-lg focus:outline-none"
          />
          
          {previewUrl && (
            <div className="relative">
              {selectedFile?.type.startsWith('image/') ? (
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full rounded-lg max-h-64 object-cover"
                />
              ) : (
                <video 
                  src={previewUrl} 
                  controls 
                  className="w-full rounded-lg max-h-64"
                />
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={removeFile}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[hsl(213,89%,52%)] transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop files here, or click to select</p>
            <p className="text-sm text-[hsl(214,8%,40%)]">Support for images, videos, GIFs • No size limit</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple={false}
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 text-[hsl(214,8%,40%)] hover:text-[hsl(213,89%,52%)]"
              >
                <Image className="h-4 w-4" />
                <span>Photo/Video</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostType('meme')}
                className={`flex items-center space-x-2 ${postType === 'meme' ? 'text-[hsl(213,89%,52%)]' : 'text-[hsl(214,8%,40%)]'} hover:text-[hsl(213,89%,52%)]`}
              >
                <Smile className="h-4 w-4" />
                <span>Meme</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPostType('memory')}
                className={`flex items-center space-x-2 ${postType === 'memory' ? 'text-[hsl(213,89%,52%)]' : 'text-[hsl(214,8%,40%)]'} hover:text-[hsl(213,89%,52%)]`}
              >
                <MapPin className="h-4 w-4" />
                <span>Memory</span>
              </Button>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-[hsl(186,100%,38%)] font-semibold">
                <span>Earn up to 100 AC</span>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={createPostMutation.isPending}
                className="bg-[hsl(213,89%,52%)] text-white px-6 py-2 hover:bg-blue-600 font-semibold"
              >
                {createPostMutation.isPending ? "Posting..." : "Post & Mine"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
