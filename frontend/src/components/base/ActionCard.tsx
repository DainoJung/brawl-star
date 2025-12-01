'use client';

interface ActionCardProps {
  icon: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export default function ActionCard({
  icon,
  title,
  subtitle,
  onClick,
  color = 'blue'
}: ActionCardProps) {
  const getColorClasses = () => {
    switch (color) {
      case 'green':
        return 'bg-green-500 hover:bg-green-600';
      case 'purple':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'orange':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-blue-500 hover:bg-blue-600';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-6 rounded-xl text-white transition-all hover:shadow-lg ${getColorClasses()}`}
    >
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="text-left">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
        </div>
      </div>
    </button>
  );
}
