'use client';

import { usePathname, useRouter } from 'next/navigation';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: 'ri-home-fill', label: '홈' },
  { path: '/medicine', icon: 'ri-capsule-fill', label: '약 관리' },
  { path: '/alarm', icon: 'ri-alarm-fill', label: '알람' },
  { path: '/chatbot', icon: 'ri-chat-3-fill', label: '챗봇' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="grid grid-cols-4 h-20">
        {navItems.map((item) => {
          const isActive = pathname === item.path ||
            (item.path !== '/' && pathname.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                isActive
                  ? 'text-blue-500 bg-blue-50'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <i className={`${item.icon} text-2xl`}></i>
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
