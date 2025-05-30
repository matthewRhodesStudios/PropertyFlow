import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Property, Task, Quote, Contractor } from "@shared/schema";
import StatsGrid from "@/components/stats-grid";
import PropertyCard from "@/components/property-card";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: quotes = [], isLoading: quotesLoading } = useQuery<Quote[]>({
    queryKey: ["/api/quotes"],
  });

  const { data: contractors = [] } = useQuery<Contractor[]>({
    queryKey: ["/api/contractors"],
  });

  // Get upcoming tasks (sorted by due date)
  const upcomingTasks = tasks
    .filter(task => task.dueDate && task.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  // Get recent quotes (last 3)
  const recentQuotes = quotes
    .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime())
    .slice(0, 3);

  const getContractorName = (contractorId: number) => {
    const contractor = contractors.find(c => c.id === contractorId);
    return contractor?.name || "Unknown Contractor";
  };

  const getPropertyAddress = (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.address || "Unknown Property";
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-accent';
      case 'low': return 'bg-primary';
      default: return 'bg-gray-400';
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'border-green-500';
      case 'rejected': return 'border-red-500';
      case 'pending': return 'border-accent';
      default: return 'border-blue-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isOverdue = date < now;
    
    const formatted = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    return { formatted, isOverdue };
  };

  return (
    <div className="p-6">
      <StatsGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Properties */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Active Properties</h3>
              <button className="text-primary hover:text-primary-dark text-sm font-medium">
                View All
              </button>
            </div>
          </div>
          <div className="p-6">
            {propertiesLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-12 bg-gray-200 rounded"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length > 0 ? (
              <div className="space-y-4">
                {properties.slice(0, 3).map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-icons text-gray-400 text-4xl mb-2">business</span>
                <p className="text-gray-500">No properties yet. Add your first property to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Upcoming Tasks</h3>
            </div>
            <div className="p-6">
              {tasksLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 animate-pulse">
                      <div className="w-2 h-2 bg-gray-200 rounded-full mt-1"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingTasks.length > 0 ? (
                <div className="space-y-4">
                  {upcomingTasks.map((task) => {
                    const { formatted, isOverdue } = formatDate(task.dueDate!);
                    return (
                      <div key={task.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-2 h-2 ${getTaskPriorityColor(task.priority)} rounded-full`}></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500">{getPropertyAddress(task.propertyId)}</p>
                          <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                            {isOverdue ? 'Overdue: ' : 'Due: '}{formatted}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="material-icons text-gray-400 text-3xl mb-2">task_alt</span>
                  <p className="text-gray-500 text-sm">No upcoming tasks</p>
                </div>
              )}
              {upcomingTasks.length > 0 && (
                <button className="w-full mt-4 text-sm text-primary hover:text-primary-dark font-medium">
                  View All Tasks
                </button>
              )}
            </div>
          </div>

          {/* Recent Quotes */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Quotes</h3>
            </div>
            <div className="p-6">
              {quotesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border-l-4 border-gray-200 pl-4 animate-pulse">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : recentQuotes.length > 0 ? (
                <div className="space-y-4">
                  {recentQuotes.map((quote) => (
                    <div key={quote.id} className={`border-l-4 ${getQuoteStatusColor(quote.status)} pl-4`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{getContractorName(quote.contractorId)}</p>
                          <p className="text-xs text-gray-500">{quote.service}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 font-roboto-mono">
                          {formatCurrency(parseFloat(quote.amount))}
                        </p>
                      </div>
                      <p className={`text-xs mt-1 ${
                        quote.status === 'accepted' ? 'text-green-600' : 
                        quote.status === 'rejected' ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {quote.status === 'accepted' ? 'Accepted' : 
                         quote.status === 'rejected' ? 'Rejected' :
                         `Received: ${new Date(quote.dateReceived).toLocaleDateString()}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <span className="material-icons text-gray-400 text-3xl mb-2">request_quote</span>
                  <p className="text-gray-500 text-sm">No quotes yet</p>
                </div>
              )}
              {recentQuotes.length > 0 && (
                <button className="w-full mt-4 text-sm text-primary hover:text-primary-dark font-medium">
                  View All Quotes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => setLocation("/properties")}
              className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="material-icons text-primary text-2xl mb-2">add_business</span>
              <span className="text-sm font-medium text-gray-900">Add Property</span>
            </button>
            <button 
              onClick={() => setLocation("/contractors")}
              className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="material-icons text-primary text-2xl mb-2">person_add</span>
              <span className="text-sm font-medium text-gray-900">Add Contractor</span>
            </button>
            <button 
              onClick={() => setLocation("/documents")}
              className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="material-icons text-primary text-2xl mb-2">upload_file</span>
              <span className="text-sm font-medium text-gray-900">Upload Document</span>
            </button>
            <button 
              onClick={() => setLocation("/reports")}
              className="flex flex-col items-center p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="material-icons text-primary text-2xl mb-2">assessment</span>
              <span className="text-sm font-medium text-gray-900">View Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
