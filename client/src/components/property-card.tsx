import type { Property } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface PropertyCardProps {
  property: Property;
  onEdit?: (property: Property) => void;
  onClick?: (property: Property) => void;
}

const statusConfig = {
  planning: { label: "Planning", color: "bg-blue-100 text-blue-800", progressColor: "bg-blue-500" },
  renovation: { label: "Renovation", color: "bg-accent/10 text-accent", progressColor: "bg-accent" },
  ready_to_sell: { label: "Ready to Sell", color: "bg-green-100 text-green-800", progressColor: "bg-green-500" },
  sold: { label: "Sold", color: "bg-gray-100 text-gray-800", progressColor: "bg-gray-500" }
};

export default function PropertyCard({ property, onEdit, onClick }: PropertyCardProps) {
  const investment = parseFloat(property.purchasePrice) + parseFloat(property.renovationBudget);
  const config = statusConfig[property.status as keyof typeof statusConfig] || statusConfig.planning;

  return (
    <div 
      className="border border-gray-200 rounded-1g p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick?.(property)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            {property.imageUrl ? (
              <img 
                src={property.imageUrl} 
                alt="Property thumbnail" 
                className="w-16 h-12 rounded object-cover" 
              />
            ) : (
              <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                <span className="material-icons text-gray-400">business</span>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-gray-900">{property.address}</h4>
              <p className="text-xs text-gray-500">{property.type}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">{property.progress}% Complete</span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end space-y-2">
          <div>
            <p className="text-sm font-medium text-gray-900 font-roboto-mono">
              {formatCurrency(investment)}
            </p>
            <p className="text-xs text-gray-500">Investment</p>
          </div>
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(property)}
              className="h-7 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3">
        <div className="bg-gray-200 rounded-full h-2">
          <div 
            className={`${config.progressColor} h-2 rounded-full transition-all`}
            style={{ width: `${property.progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
