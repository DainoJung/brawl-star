'use client';

import { useRouter } from 'next/navigation';

interface TopHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export default function TopHeader({
  title,
  showBack = false,
  onBack,
  rightAction
}: TopHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={handleBack}
              className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-500 mr-2"
            >
              <i className="ri-arrow-left-line text-xl"></i>
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        {rightAction && (
          <div className="flex items-center">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}
