import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import SidebarLeft from "@/components/sidebar-left";
import SidebarRight from "@/components/sidebar-right";
import PostCard from "@/components/post-card";
import CreatePostModal from "@/components/create-post-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Smile, Heart } from "lucide-react";
import { useState } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { PostWithUser } from "@shared/schema";

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { data: posts = [], isLoading: postsLoading, error } = useQuery<PostWithUser[]>({
    queryKey: ['/api/posts'],
    retry: false,
  });

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [error, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-facebook-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading BlockSocial...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(218,20%,97%)]">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-3">
            <SidebarLeft user={user} onUploadClick={() => setIsCreateModalOpen(true)} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6">
            {/* Create Post Section */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <img 
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=150&h=150"}
                    alt="User Profile" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-left text-text-secondary hover:bg-gray-200 transition-colors"
                  >
                    What's on your mind? Share and earn Ahmiyat coins!
                  </button>
                </div>
                <hr className="border-gray-200 mb-4" />
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    className="flex-1 flex items-center justify-center py-2 text-text-secondary hover:bg-gray-50"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Image className="h-5 w-5 text-green-600 mr-2" />
                    Photo/Video
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 flex items-center justify-center py-2 text-text-secondary hover:bg-gray-50"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Smile className="h-5 w-5 text-yellow-600 mr-2" />
                    Meme
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 flex items-center justify-center py-2 text-text-secondary hover:bg-gray-50"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    <Heart className="h-5 w-5 text-red-600 mr-2" />
                    Memory
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            {postsLoading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="h-48 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Image className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                  <p className="text-text-secondary mb-4">
                    Be the first to share content and start earning Ahmiyat coins!
                  </p>
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-facebook-blue hover:bg-blue-600 text-white"
                  >
                    Create Your First Post
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
                
                <div className="text-center">
                  <Button className="bg-facebook-blue text-white px-8 py-3 hover:bg-blue-600">
                    Load More Posts
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-3">
            <SidebarRight />
          </div>
        </div>
      </div>

      <CreatePostModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        user={user}
      />
    </div>
  );
}
