import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Coins, Users, Image, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-facebook-blue to-blockchain-accent rounded-full flex items-center justify-center">
              <Box className="text-white text-2xl" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-facebook-blue to-blockchain-accent bg-clip-text text-transparent">
              BlockSocial
            </h1>
          </div>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            The first social media platform powered by Ahmiyat blockchain. Share content, earn coins, and be part of the decentralized future.
          </p>
        </header>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-mining-reward rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Earn Ahmiyat Coins</h3>
              <p className="text-text-secondary">
                Get rewarded with AC tokens for every post, like, comment, and share. Your engagement directly translates to earnings.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-blockchain-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Image className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Everything</h3>
              <p className="text-text-secondary">
                Upload images, videos, memes, and memories without size limits. Express yourself freely and get rewarded.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-facebook-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Social Mining</h3>
              <p className="text-text-secondary">
                Connect with friends, discover content, and mine coins together. The more you engage, the more you earn.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-facebook-blue mb-2">10,000,000</div>
              <div className="text-text-secondary">Total AC Supply</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-mining-reward mb-2">7,523,891</div>
              <div className="text-text-secondary">Circulating Supply</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blockchain-accent mb-2">∞</div>
              <div className="text-text-secondary">File Size Limit</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-text-secondary">Mining Active</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-facebook-blue to-mining-reward rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ready to Start Mining?</h3>
              <p className="text-text-secondary mb-6">
                Join thousands of users already earning Ahmiyat coins through social interaction.
              </p>
              <Button 
                onClick={handleLogin}
                className="w-full bg-facebook-blue hover:bg-blue-600 text-white py-3 text-lg"
              >
                Sign In with Replit
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
