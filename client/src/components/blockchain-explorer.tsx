import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Box, 
  Hash, 
  Clock, 
  Zap, 
  TrendingUp, 
  Activity,
  Pickaxe,
  Shield
} from "lucide-react";

interface BlockchainInfo {
  latestBlockNumber: number;
  totalBlocks: number;
  totalTransactions: number;
  difficulty: number;
  hashRate: number;
  averageBlockTime: number;
}

export default function BlockchainExplorer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: blockchainInfo } = useQuery<BlockchainInfo>({
    queryKey: ['/api/blockchain/info'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const mineMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/blockchain/mine');
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/blockchain/info'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/blockchain'] });
      toast({
        title: "Block Mined Successfully!",
        description: `Block #${data.block.blockNumber} mined. Earned ${data.block.reward} AC!`,
      });
    },
    onError: () => {
      toast({
        title: "Mining Failed",
        description: "Failed to mine block. Try again later.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Box className="h-6 w-6" />
            <span>Ahmiyat Blockchain Explorer</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">#{blockchainInfo?.latestBlockNumber || 0}</div>
              <div className="text-blue-100">Latest Block</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{blockchainInfo?.totalBlocks || 0}</div>
              <div className="text-blue-100">Total Blocks</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{blockchainInfo?.totalTransactions || 0}</div>
              <div className="text-blue-100">Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{blockchainInfo?.difficulty || 4}</div>
              <div className="text-blue-100">Difficulty</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span>Network Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Hash Rate</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                {blockchainInfo?.hashRate || 0} H/s
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Block Time</span>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {blockchainInfo?.averageBlockTime || 30}s
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Security</span>
              <Badge className="bg-green-500">
                <Shield className="h-3 w-3 mr-1" />
                High
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Pickaxe className="h-5 w-5 text-orange-600" />
              <span>Manual Mining</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Mine a new block manually and earn 100 AC mining reward plus transaction fees.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Mining Reward:</span>
                  <div className="font-semibold text-orange-600">100 AC</div>
                </div>
                <div>
                  <span className="text-gray-500">Proof of Work:</span>
                  <div className="font-semibold">SHA-256</div>
                </div>
              </div>
              <Button
                onClick={() => mineMutation.mutate()}
                disabled={mineMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Pickaxe className="h-4 w-4 mr-2" />
                {mineMutation.isPending ? "Mining..." : "Mine Block"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Hash className="h-5 w-5 text-purple-600" />
            <span>Blockchain Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold">Proof of Work</h3>
              <p className="text-sm text-gray-600">SHA-256 mining algorithm with adjustable difficulty</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Hash className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold">Merkle Trees</h3>
              <p className="text-sm text-gray-600">Efficient transaction verification and integrity</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold">Immutable</h3>
              <p className="text-sm text-gray-600">Cryptographically secured transaction history</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}