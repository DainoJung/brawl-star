'use client';

interface MedicineCardProps {
  name: string;
  time: string;
  status: 'completed' | 'pending' | 'missed';
  onClick?: () => void;
}

export default function MedicineCard({ name, time, status, onClick }: MedicineCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'pending':
        return '🔔';
      case 'missed':
        return '⚠️';
      default:
        return '💊';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return '복용 완료';
      case 'pending':
        return '예정';
      case 'missed':
        return '놓침';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-blue-50 border-blue-200';
      case 'missed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div
      className={`p-4 rounded-xl border-2 ${getStatusColor()} cursor-pointer transition-all hover:shadow-md`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <p className="text-base text-gray-600">{time}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-medium ${
            status === 'completed' ? 'text-green-600' :
            status === 'pending' ? 'text-blue-600' :
            'text-red-600'
          }`}>
            {getStatusText()}
          </span>
        </div>
      </div>
    </div>
  );
}
