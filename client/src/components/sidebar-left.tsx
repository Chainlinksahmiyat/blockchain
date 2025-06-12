import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Upload, Pickaxe, History, Coins, Box } from "lucide-react";
import { useState } from "react";
import type { User } from "@shared/schema";
import BlockchainExplorer from "./blockchain-explorer";

interface SidebarLeftProps {
  user?: User;
  onUploadClick: () => void;
}

interface BlockchainStats {
  totalSupply: number;
  circulating: number;
  userBalance: number;
  todaysMining: number;
}

export default function SidebarLeft({ user, onUploadClick }: SidebarLeftProps) {
  const [showBlockchainExplorer, setShowBlockchainExplorer] = useState(false);
  
  const { data: stats } = useQuery<BlockchainStats>({
    queryKey: ['/api/stats/blockchain'],
    retry: false,
  });

  if (showBlockchainExplorer) {
    return (
      <div className="space-y-6">
        <Button 
          onClick={() => setShowBlockchainExplorer(false)}
          variant="outline"
          className="w-full"
        >
          ← Back to Dashboard
        </Button>
        <BlockchainExplorer />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Blockchain Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[hsl(214,8%,40%)]">Total Supply</span>
              <span className="font-semibold text-[hsl(207,75%,62%)]">
                {stats?.totalSupply?.toLocaleString() || '10,000,000'} AC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[hsl(214,8%,40%)]">Circulating</span>
              <span className="font-semibold">
                {stats?.circulating?.toLocaleString() || '0'} AC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[hsl(214,8%,40%)]">Your Balance</span>
              <span className="font-semibold text-[hsl(186,100%,38%)]">
                {user?.coinBalance?.toLocaleString() || '0'} AC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[hsl(214,8%,40%)]">Today's Mining</span>
              <span className="font-semibold text-green-600">
                +{stats?.todaysMining?.toLocaleString() || '0'} AC
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[hsl(214,8%,40%)]">Latest Block</span>
              <span className="font-semibold text-purple-600">
                #{stats?.latestBlockNumber || '0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button 
              onClick={onUploadClick}
              className="w-full bg-[hsl(213,89%,52%)] text-white hover:bg-blue-600"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
            <Button 
              onClick={() => setShowBlockchainExplorer(true)}
              className="w-full bg-[hsl(186,100%,38%)] text-white hover:bg-cyan-600"
            >
              <Pickaxe className="mr-2 h-4 w-4" />
              Mine Ahmiyat
            </Button>
            <Button 
              onClick={() => setShowBlockchainExplorer(true)}
              variant="secondary"
              className="w-full bg-gray-100 text-[hsl(214,8%,40%)] hover:bg-gray-200"
            >
              <Box className="mr-2 h-4 w-4" />
              Blockchain Explorer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
