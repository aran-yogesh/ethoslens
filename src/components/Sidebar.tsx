import React from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  BarChart3, 
  FileText, 
  Settings, 
  AlertTriangle,
  Users,
  Activity
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'monitor', icon: Activity, label: 'Live Monitor' },
    { id: 'logs', icon: FileText, label: 'Audit Logs' },
    { id: 'violations', icon: AlertTriangle, label: 'Violations' },
    { id: 'agents', icon: Users, label: 'Agents' },
    { id: 'health', icon: Activity, label: 'Health' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <motion.div 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col"
    >
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Shield className="h-7 w-7 text-black" />
          <div>
            <h1 className="text-lg font-semibold text-black">EthosLens</h1>
            <p className="text-sm text-gray-500">AI Governance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <motion.button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center space-x-3 px-6 py-2.5 text-left transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-50 hover:text-black'
            }`}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
          >
            <item.icon className="h-4 w-4" />
            <span className="font-medium text-sm">{item.label}</span>
          </motion.button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-200">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">System Status</span>
          </div>
          <p className="text-xs text-gray-500">All agents operational</p>
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
