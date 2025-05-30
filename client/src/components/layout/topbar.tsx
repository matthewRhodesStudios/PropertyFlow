import { useLocation } from "wouter";

const pageNames: Record<string, string> = {
  "/": "Dashboard",
  "/properties": "Properties",
  "/contractors": "Contractors", 
  "/documents": "Documents",
  "/quotes": "Quotes",
  "/gantt": "Timeline",
  "/reports": "Reports"
};

export default function TopBar() {
  const [location] = useLocation();
  const pageName = pageNames[location] || "Dashboard";

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center">
          <button className="lg:hidden mr-4">
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
    </header>
  );
}
