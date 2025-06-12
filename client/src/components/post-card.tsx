import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThumbsUp, MessageCircle, Share, Coins } from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { PostWithUser } from "@shared/schema";

interface PostCardProps {
  post: PostWithUser;
}

export default function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/posts/${post.id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Post liked!",
        description: "You earned 5 AC for liking this post",
      });
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
        description: "Failed to like post",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img 
              src={post.user.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"}
              alt={`${post.user.firstName} ${post.user.lastName}`}
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h4 className="font-semibold">
                {post.user.firstName} {post.user.lastName}
              </h4>
              <p className="text-sm text-[hsl(214,8%,40%)]">
                {formatTimeAgo(post.createdAt!)} • +{post.coinsEarned} AC earned
              </p>
            </div>
          </div>
          <div className="text-[hsl(186,100%,38%)] font-semibold">
            <Coins className="inline h-4 w-4 mr-1" />
            +{post.coinsEarned} AC
          </div>
        </div>
        
        <p className="mb-4">{post.content}</p>
        
        {post.imageUrl && (
          <img 
            src={post.imageUrl}
            alt="Post content"
            className="w-full rounded-lg mb-4 object-cover max-h-96"
          />
        )}
        
        {post.videoUrl && (
          <video 
            src={post.videoUrl}
            controls
            className="w-full rounded-lg mb-4 max-h-96"
          />
        )}
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className={`flex items-center space-x-2 ${post.isLiked ? 'text-[hsl(213,89%,52%)]' : 'text-[hsl(214,8%,40%)]'} hover:text-[hsl(213,89%,52%)]`}
            >
              <ThumbsUp className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-[hsl(214,8%,40%)] hover:text-[hsl(213,89%,52%)]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{post.comments}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2 text-[hsl(214,8%,40%)] hover:text-[hsl(213,89%,52%)]"
            >
              <Share className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
          <div className="text-sm text-[hsl(186,100%,38%)]">
            Mining reward: +{post.coinsEarned} AC
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
