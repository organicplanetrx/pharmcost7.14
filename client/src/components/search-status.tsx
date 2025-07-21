import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface SearchStatusProps {
  status: string;
  message?: string;
}

export default function SearchStatus({ status, message }: SearchStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          title: 'Connecting to Kinray Portal',
          description: 'Establishing secure connection and authenticating...'
        };
      case 'in_progress':
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin text-blue-600" />,
          color: 'bg-blue-50 border-blue-200',
          textColor: 'text-blue-800',
          title: 'Searching Kinray Portal',
          description: 'Authenticated successfully, now extracting medication pricing data...'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          color: 'bg-green-50 border-green-200',
          textColor: 'text-green-800',
          title: 'Search Completed',
          description: 'Successfully retrieved medication data from Kinray portal'
        };
      case 'failed':
        return {
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          color: 'bg-red-50 border-red-200',
          textColor: 'text-red-800',
          title: 'Search Failed',
          description: message || 'Browser automation not available in current deployment environment'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-gray-600" />,
          color: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-800',
          title: 'Unknown Status',
          description: 'Search status unclear'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`${statusInfo.color} border rounded-lg p-4`}>
      <div className="flex items-start space-x-3">
        {statusInfo.icon}
        <div>
          <h4 className={`font-medium ${statusInfo.textColor}`}>
            {statusInfo.title}
          </h4>
          <p className={`text-sm ${statusInfo.textColor} mt-1`}>
            {statusInfo.description}
          </p>
        </div>
      </div>
    </div>
  );
}