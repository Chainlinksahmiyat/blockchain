import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Box, Coins, Users, Image, Zap } from "lucide-react";
import { useState } from "react";

export default function Landing() {
  // Wallet-based auth state
  const [wallet, setWallet] = useState<string | null>(null);
  const [backup, setBackup] = useState<string | null>(null);
  const [importValue, setImportValue] = useState("");

  // Generate a new wallet (for demo: random string, use real crypto in prod)
  const handleCreateWallet = () => {
    const newWallet = `WALLET_${Math.random().toString(36).slice(2)}`;
    setWallet(newWallet);
    setBackup(newWallet); // In real app, show/save private key or mnemonic
    localStorage.setItem("wallet", newWallet);
  };

  // Import wallet from backup
  const handleImportWallet = () => {
    if (importValue.trim()) {
      setWallet(importValue.trim());
      localStorage.setItem("wallet", importValue.trim());
    }
  };

  // UI
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

        {/* Wallet Auth UI */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="w-16 h-16 bg-gradient-to-r from-facebook-blue to-mining-reward rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="text-white text-xl" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Wallet Sign Up / Sign In</h3>
              {!wallet ? (
                <>
                  <Button onClick={handleCreateWallet} className="w-full bg-facebook-blue hover:bg-blue-600 text-white py-3 text-lg mb-4">
                    Create New Wallet
                  </Button>
                  <div className="my-4 text-text-secondary">or</div>
                  <input
                    type="text"
                    placeholder="Paste your wallet backup here"
                    value={importValue}
                    onChange={e => setImportValue(e.target.value)}
                    className="w-full border rounded px-3 py-2 mb-2"
                  />
                  <Button onClick={handleImportWallet} className="w-full bg-blockchain-accent hover:bg-blue-600 text-white py-3 text-lg">
                    Import Wallet
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4">
                    <div className="font-mono text-sm break-all">Wallet: {wallet}</div>
                    {backup && (
                      <div className="mt-2 text-xs text-green-700">Backup this: <span className="font-mono">{backup}</span></div>
                    )}
                  </div>
                  <div className="text-green-700 font-bold">You are signed in!</div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
