import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertCircle, Server, Database, Zap, Globe, Clock } from 'lucide-react';
import { API_URLS, API_CONFIG } from '../config/api';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'error' | 'checking';
  url?: string;
  port?: string;
  responseTime?: number;
  details?: string;
  lastChecked?: Date;
}

const Health: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Backend Server', status: 'checking', url: API_CONFIG.BASE_URL, port: '4000' },
    { name: 'Frontend Server', status: 'checking', url: window.location.origin, port: '5173' },
    { name: 'Inkeep Run API', status: 'checking', url: 'http://localhost:3003', port: '3003' },
    { name: 'Inkeep Manage API', status: 'checking', url: 'http://localhost:3002', port: '3002' },
    { name: 'CopilotKit API', status: 'checking', url: API_URLS.copilotkit },
    { name: 'Neo4j Database', status: 'checking' },
    { name: 'OpenAI API', status: 'checking' },
    { name: 'Perplexity API', status: 'checking' },
    { name: 'LlamaIndex', status: 'checking' },
  ]);

  const [overallHealth, setOverallHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');

  useEffect(() => {
    checkAllServices();
    // Refresh every 30 seconds
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAllServices = async () => {
    const updatedServices: ServiceStatus[] = [];

    // Check Backend Server
    try {
      const startTime = Date.now();
      const response = await fetch(API_URLS.health);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        updatedServices.push({
          name: 'Backend Server',
          status: 'healthy',
          url: API_CONFIG.BASE_URL,
          port: '4000',
          responseTime,
          details: `Status: ${data.status}`,
          lastChecked: new Date(),
        });

        // Update individual service statuses from backend health check
        updatedServices.push({
          name: 'Neo4j Database',
          status: data.services?.neo4j ? 'healthy' : 'error',
          details: data.services?.neo4j ? 'Connected' : 'Not connected',
          lastChecked: new Date(),
        });

        updatedServices.push({
          name: 'LlamaIndex',
          status: data.services?.llamaIndex ? 'healthy' : 'error',
          details: data.services?.llamaIndex ? 'Configured' : 'Not configured',
          lastChecked: new Date(),
        });

        updatedServices.push({
          name: 'CopilotKit API',
          status: data.services?.copilotKit ? 'healthy' : 'error',
          url: API_URLS.copilotkit,
          details: data.services?.copilotKit ? 'Active' : 'Inactive',
          lastChecked: new Date(),
        });
      } else {
        updatedServices.push({
          name: 'Backend Server',
          status: 'error',
          url: API_CONFIG.BASE_URL,
          port: '4000',
          details: `HTTP ${response.status}`,
          lastChecked: new Date(),
        });
      }
    } catch (error) {
      updatedServices.push({
        name: 'Backend Server',
        status: 'error',
        url: API_CONFIG.BASE_URL,
        port: '4000',
        details: error instanceof Error ? error.message : 'Connection failed',
        lastChecked: new Date(),
      });
    }

    // Check Frontend Server
    updatedServices.push({
      name: 'Frontend Server',
      status: 'healthy',
      url: window.location.origin,
      port: '5173',
      details: 'Running (you are here)',
      lastChecked: new Date(),
    });

    // Check Inkeep Run API
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:3003/health');
      const responseTime = Date.now() - startTime;
      
      // HTTP 204 (No Content) is success for Inkeep health check
      if (response.status === 204 || response.ok) {
        updatedServices.push({
          name: 'Inkeep Run API',
          status: 'healthy',
          url: 'http://localhost:3003',
          port: '3003',
          responseTime,
          details: 'AI Governance agents active',
          lastChecked: new Date(),
        });
      } else {
        updatedServices.push({
          name: 'Inkeep Run API',
          status: 'error',
          url: 'http://localhost:3003',
          port: '3003',
          details: `HTTP ${response.status}`,
          lastChecked: new Date(),
        });
      }
    } catch (error) {
      updatedServices.push({
        name: 'Inkeep Run API',
        status: 'error',
        url: 'http://localhost:3003',
        port: '3003',
        details: 'Not available',
        lastChecked: new Date(),
      });
    }

    // Check Inkeep Manage API
    try {
      const startTime = Date.now();
      const response = await fetch('http://localhost:3002/health');
      const responseTime = Date.now() - startTime;
      
      // HTTP 204 (No Content) is success
      if (response.status === 204 || response.ok) {
        updatedServices.push({
          name: 'Inkeep Manage API',
          status: 'healthy',
          url: 'http://localhost:3002',
          port: '3002',
          responseTime,
          details: 'Management API active',
          lastChecked: new Date(),
        });
      } else {
        updatedServices.push({
          name: 'Inkeep Manage API',
          status: 'error',
          url: 'http://localhost:3002',
          port: '3002',
          details: `HTTP ${response.status}`,
          lastChecked: new Date(),
        });
      }
    } catch (error) {
      updatedServices.push({
        name: 'Inkeep Manage API',
        status: 'error',
        url: 'http://localhost:3002',
        port: '3002',
        details: 'Not available',
        lastChecked: new Date(),
      });
    }

    // Check OpenAI API (indirect check via environment)
    updatedServices.push({
      name: 'OpenAI API',
      status: import.meta.env.VITE_OPENAI_API_KEY ? 'healthy' : 'error',
      details: import.meta.env.VITE_OPENAI_API_KEY ? 'API key configured' : 'API key missing',
      lastChecked: new Date(),
    });

    // Check Perplexity API
    updatedServices.push({
      name: 'Perplexity API',
      status: import.meta.env.VITE_PERPLEXITY_API_KEY ? 'healthy' : 'error',
      details: import.meta.env.VITE_PERPLEXITY_API_KEY ? 'API key configured' : 'API key missing',
      lastChecked: new Date(),
    });

    setServices(updatedServices);

    // Calculate overall health
    const errorCount = updatedServices.filter(s => s.status === 'error').length;
    if (errorCount === 0) {
      setOverallHealth('healthy');
    } else if (errorCount <= 2) {
      setOverallHealth('degraded');
    } else {
      setOverallHealth('down');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('Server')) return <Server className="h-5 w-5" />;
    if (name.includes('Database')) return <Database className="h-5 w-5" />;
    if (name.includes('API')) return <Zap className="h-5 w-5" />;
    return <Globe className="h-5 w-5" />;
  };

  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const totalCount = services.length;
  const healthPercentage = Math.round((healthyCount / totalCount) * 100);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Activity className="h-8 w-8 mr-3 text-blue-600" />
                System Health
              </h1>
              <p className="text-gray-600 mt-2">Monitor the status of all services and APIs</p>
            </div>
            <button
              onClick={checkAllServices}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Activity className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Overall Health Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-8 p-6 rounded-xl border-2 ${
            overallHealth === 'healthy'
              ? 'bg-green-50 border-green-200'
              : overallHealth === 'degraded'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Overall Status: {overallHealth === 'healthy' ? '✅ Healthy' : overallHealth === 'degraded' ? '⚠️ Degraded' : '❌ Down'}
              </h2>
              <p className="text-gray-700">
                {healthyCount} of {totalCount} services operational ({healthPercentage}%)
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">{healthPercentage}%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-6 rounded-lg border-2 ${
                service.status === 'healthy'
                  ? 'bg-white border-green-200'
                  : service.status === 'error'
                  ? 'bg-white border-red-200'
                  : 'bg-white border-yellow-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-gray-600">{getServiceIcon(service.name)}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                    {service.port && (
                      <p className="text-xs text-gray-500">Port: {service.port}</p>
                    )}
                  </div>
                </div>
                {getStatusIcon(service.status)}
              </div>

              {service.url && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-1">URL:</p>
                  <p className="text-sm text-blue-600 truncate font-mono">{service.url}</p>
                </div>
              )}

              {service.details && (
                <div className="mb-2">
                  <p className="text-sm text-gray-700">{service.details}</p>
                </div>
              )}

              {service.responseTime && (
                <div className="mb-2">
                  <p className="text-xs text-gray-500">Response time: {service.responseTime}ms</p>
                </div>
              )}

              {service.lastChecked && (
                <div className="flex items-center space-x-1 text-xs text-gray-400 mt-3">
                  <Clock className="h-3 w-3" />
                  <span>Last checked: {service.lastChecked.toLocaleTimeString()}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Configuration Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 font-medium">Backend URL:</p>
              <p className="text-gray-900 font-mono">{API_CONFIG.BASE_URL}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Frontend URL:</p>
              <p className="text-gray-900 font-mono">{window.location.origin}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">Environment:</p>
              <p className="text-gray-900">{import.meta.env.MODE || 'development'}</p>
            </div>
            <div>
              <p className="text-gray-600 font-medium">CopilotKit Endpoint:</p>
              <p className="text-gray-900 font-mono truncate">{API_URLS.copilotkit}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Health;
