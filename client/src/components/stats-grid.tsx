import { useQuery } from "@tanstack/react-query";

export default function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="ml-4 flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      label: "Active Properties",
      value: stats?.activeProperties || 0,
      icon: "business",
      iconColor: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Total Investment",
      value: `$${stats?.totalInvestment ? parseFloat(stats.totalInvestment).toLocaleString() : 0}`,
      icon: "trending_up", 
      iconColor: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      label: "In Renovation",
      value: stats?.inRenovation || 0,
      icon: "construction",
      iconColor: "text-accent",
      bgColor: "bg-accent/10"
    },
    {
      label: "Projected ROI",
      value: `${stats?.projectedROI || 0}%`,
      icon: "attach_money",
      iconColor: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                <span className={`material-icons ${stat.iconColor} text-lg`}>{stat.icon}</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900 font-roboto-mono">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
