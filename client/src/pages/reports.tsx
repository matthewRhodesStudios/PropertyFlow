import { useQuery } from "@tanstack/react-query";
import type { Property, Quote, Task, Contractor } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";

export default function Reports() {
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  const isLoading = propertiesLoading || quotesLoading || tasksLoading;

  // Calculate financial metrics
  const calculateFinancials = () => {
    const totalInvestment = properties.reduce((sum, p) => 
      sum + parseFloat(p.purchasePrice) + parseFloat(p.renovationBudget), 0
    );
    
    const totalProjectedValue = properties.reduce((sum, p) => 
      sum + (p.projectedSalePrice ? parseFloat(p.projectedSalePrice) : 0), 0
    );
    
    const projectedProfit = totalProjectedValue - totalInvestment;
    const projectedROI = totalInvestment > 0 ? (projectedProfit / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalProjectedValue,
      projectedProfit,
      projectedROI
    };
  };

  // Calculate property status breakdown
  const getPropertyStatusBreakdown = () => {
    const breakdown = properties.reduce((acc, property) => {
      acc[property.status] = (acc[property.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { status: "Planning", count: breakdown.planning || 0, color: "bg-blue-500" },
      { status: "Renovation", count: breakdown.renovation || 0, color: "bg-accent" },
      { status: "Ready to Sell", count: breakdown.ready_to_sell || 0, color: "bg-green-500" },
      { status: "Sold", count: breakdown.sold || 0, color: "bg-gray-500" }
    ];
  };

  // Calculate contractor performance
  const getContractorPerformance = () => {
    const contractorQuotes = contractors.map(contractor => {
      const contractorQuotesList = quotes.filter(q => q.contractorId === contractor.id);
      const acceptedQuotes = contractorQuotesList.filter(q => q.status === 'accepted');
      const avgQuoteAmount = contractorQuotesList.length > 0 
        ? contractorQuotesList.reduce((sum, q) => sum + parseFloat(q.amount), 0) / contractorQuotesList.length
        : 0;
      
      return {
        contractor,
        totalQuotes: contractorQuotesList.length,
        acceptedQuotes: acceptedQuotes.length,
        acceptanceRate: contractorQuotesList.length > 0 ? (acceptedQuotes.length / contractorQuotesList.length) * 100 : 0,
        avgQuoteAmount
      };
    }).filter(item => item.totalQuotes > 0).sort((a, b) => b.acceptanceRate - a.acceptanceRate);

    return contractorQuotes.slice(0, 5);
  };

  // Calculate task completion metrics
  const getTaskMetrics = () => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
    ).length;
    
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      completionRate
    };
  };

  // Get recent activity
  const getRecentActivity = () => {
    const recentQuotes = quotes
      .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime())
      .slice(0, 5);
    
    const upcomingTasks = tasks
      .filter(task => task.dueDate && task.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
      .slice(0, 5);

    return { recentQuotes, upcomingTasks };
  };

  const handleExportData = () => {
    const exportData = {
      properties,
      quotes,
      tasks,
      contractors,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `propertyflow-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Reports</h1>
          <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const financials = calculateFinancials();
  const statusBreakdown = getPropertyStatusBreakdown();
  const contractorPerformance = getContractorPerformance();
  const taskMetrics = getTaskMetrics();
  const { recentQuotes, upcomingTasks } = getRecentActivity();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <Button onClick={handleExportData} className="bg-primary hover:bg-primary-dark">
          <span className="material-icons mr-2">download</span>
          Export Data
        </Button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 font-roboto-mono">
              {formatCurrency(financials.totalInvestment)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Projected Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-semibold text-gray-900 font-roboto-mono">
              {formatCurrency(financials.totalProjectedValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Projected Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-xl sm:text-2xl font-semibold font-roboto-mono ${
              financials.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {financials.projectedProfit >= 0 ? '+' : ''}{formatCurrency(Math.abs(financials.projectedProfit))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Projected ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold font-roboto-mono ${
              financials.projectedROI >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {financials.projectedROI >= 0 ? '+' : ''}{financials.projectedROI.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Property Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Property Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <div className="space-y-4">
                {statusBreakdown.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between font-medium">
                  <span>Total Properties</span>
                  <span>{properties.length}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-4xl mb-2">business</span>
                <p className="text-gray-500">No properties to analyze</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Completion Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {taskMetrics.totalTasks > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Tasks</span>
                  <span className="text-lg font-semibold text-gray-900">{taskMetrics.totalTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Completed</span>
                  <span className="text-lg font-semibold text-green-600">{taskMetrics.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Overdue</span>
                  <span className="text-lg font-semibold text-red-600">{taskMetrics.overdueTasks}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Completion Rate</span>
                  <span className="text-lg font-semibold text-primary">{taskMetrics.completionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all" 
                    style={{ width: `${taskMetrics.completionRate}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-4xl mb-2">task_alt</span>
                <p className="text-gray-500">No tasks to analyze</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contractor Performance */}
      {contractorPerformance.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Top Performing Contractors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {contractorPerformance.map((item) => (
                <div key={item.contractor.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-gray-900">{item.contractor.name}</h4>
                      <Badge className="bg-blue-100 text-blue-800">{item.contractor.specialty}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{item.totalQuotes}</span> total quotes
                      </div>
                      <div>
                        <span className="font-medium">{item.acceptedQuotes}</span> accepted
                      </div>
                      <div>
                        Avg: <span className="font-medium font-roboto-mono">${item.avgQuoteAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {item.acceptanceRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">acceptance rate</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            {recentQuotes.length > 0 ? (
              <div className="space-y-3">
                {recentQuotes.map((quote) => {
                  const contractor = contractors.find(c => c.id === quote.contractorId);
                  const property = properties.find(p => p.id === quote.propertyId);
                  return (
                    <div key={quote.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{quote.service}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {contractor?.name} • {property?.address}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 font-roboto-mono">
                          ${parseFloat(quote.amount).toLocaleString()}
                        </p>
                        <Badge className={
                          quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {quote.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-4xl mb-2">request_quote</span>
                <p className="text-gray-500">No recent quotes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingTasks.length > 0 ? (
              <div className="space-y-3">
                {upcomingTasks.map((task) => {
                  const property = properties.find(p => p.id === task.propertyId);
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                  return (
                    <div key={task.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-b-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        task.priority === 'high' ? 'bg-red-500' :
                        task.priority === 'medium' ? 'bg-accent' : 'bg-primary'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 truncate">{property?.address}</p>
                        {task.dueDate && (
                          <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                            {isOverdue ? 'Overdue: ' : 'Due: '}
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-4xl mb-2">task_alt</span>
                <p className="text-gray-500">No upcoming tasks</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
