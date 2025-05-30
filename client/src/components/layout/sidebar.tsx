import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Properties", href: "/properties", icon: "business" },
    { name: "Contractors", href: "/contractors", icon: "build" },
    { name: "Documents", href: "/documents", icon: "folder" },
    { name: "Quotes", href: "/quotes", icon: "request_quote" },
    { name: "Reports", href: "/reports", icon: "assessment" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <div className="hidden lg:flex lg:flex-shrink-0 lg:w-72 bg-white shadow-lg">
      <div className="flex flex-col w-full">
        {/* Logo/Brand */}
        <div className="flex items-center h-16 px-6 bg-primary">
          <span className="material-icons text-white text-2xl mr-3">home_work</span>
          <h1 className="text-xl font-medium text-white">PropertyFlow</h1>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="material-icons mr-3 text-xl">{item.icon}</span>
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">JD</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">john@example.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
