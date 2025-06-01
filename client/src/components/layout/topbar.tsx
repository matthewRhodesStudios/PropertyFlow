import { useLocation } from "wouter";
import { useState } from "react";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/properties": "Properties",
  "/contractors": "Contractors", 
  "/documents": "Documents",
  "/quotes": "Quotes",
  "/gantt": "Timeline",
  "/reports": "Reports",
  "/expenses": "Expenses",
  "/calendar": "Calendar",
  // Add more mappings as needed
};

export default function TopBar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pageName = pageNames[location] || "Dashboard";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button 
            className="lg:hidden mr-4 p-2 hover:bg-gray-100 rounded"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="material-icons text-gray-600">menu</span>
          </button>
          <h2 className="text-xl font-medium text-gray-900">{pageName}</h2>
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <span className="material-icons">notifications</span>
          </button>
          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <span className="material-icons">search</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 flex z-40">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="material-icons text-white">close</span>
                </button>
              </div>
              <div className="flex items-center h-16 px-6 bg-primary">
                <span className="material-icons text-white text-2xl mr-3">home_work</span>
                <h1 className="text-xl font-medium text-white">PropertyFlow</h1>
              </div>
              <div className="flex-1 px-4 py-6 space-y-2">
                {/* Mobile navigation items - reuse from sidebar */}
                <MobileNavItems onItemClick={() => setMobileMenuOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileNavItems({ onItemClick }: { onItemClick: () => void }) {
  const [location] = useLocation();
  
  const navigation = [
    { name: "Dashboard", href: "/", icon: "dashboard" },
    { name: "Properties", href: "/properties", icon: "business" },
    { name: "Contractors", href: "/contractors", icon: "build" },
    { name: "Documents", href: "/documents", icon: "folder" },
    { name: "Quotes", href: "/quotes", icon: "request_quote" },
    { name: "Timeline", href: "/gantt", icon: "timeline" },
    { name: "Expenses", href: "/expenses", icon: "receipt" },
    { name: "Reports", href: "/reports", icon: "assessment" },
    { name: "Calendar", href: "/calendar", icon: "calendar" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <>
      {navigation.map((item) => (
        <a
          key={item.name}
          href={item.href}
          onClick={onItemClick}
          className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            isActive(item.href)
              ? "bg-primary/10 text-primary"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="material-icons mr-3 text-xl">{item.icon}</span>
          {item.name}
        </a>
      ))}
    </>
  );
}
