import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { Coins } from "lucide-react";
import type { User, Transaction } from "@shared/schema";

interface TopMiner extends User {
  todayEarnings: number;
}

export default function SidebarRight() {
  const { data: topMiners = [] } = useQuery<TopMiner[]>({
    queryKey: ['/api/stats/top-miners'],
    retry: false,
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
    retry: false,
  });

  const recentTransactions = transactions.slice(0, 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Top Miners Today</h3>
          <div className="space-y-4">
            {topMiners.length === 0 ? (
              <p className="text-sm text-[hsl(214,8%,40%)]">No miners data available</p>
            ) : (
              topMiners.map((miner, index) => (
                <div key={miner.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={miner.profileImageUrl || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&h=100"}
                      alt={`${miner.firstName} ${miner.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium">
                      {miner.firstName} {miner.lastName}
                    </span>
                  </div>
                  <span className="text-[hsl(186,100%,38%)] font-semibold">
                    +{miner.todayEarnings} AC
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-[hsl(214,8%,40%)]">No recent transactions</p>
            ) : (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-[hsl(214,8%,40%)] text-xs">
                      {new Date(tx.createdAt!).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-green-600 font-semibold">+{tx.amount} AC</span>
                </div>
              ))
            )}
          </div>
          {transactions.length > 3 && (
            <Button variant="ghost" className="w-full mt-4 text-[hsl(213,89%,52%)] text-sm font-medium">
              View All Transactions
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-[hsl(213,89%,52%)] to-[hsl(207,75%,62%)] text-white">
        <CardContent className="p-6">
          <h3 className="font-semibold text-lg mb-2">Mining Challenge</h3>
          <p className="text-blue-100 text-sm mb-4">
            Upload 5 pieces of content today to unlock a 200 AC bonus!
          </p>
          <Progress value={60} className="mb-2 bg-white/20" />
          <p className="text-xs text-blue-100">3 of 5 completed</p>
        </CardContent>
      </Card>
    </div>
  );
}
