import config from '../../config/env'
import { NetworkIndicator } from '../ui/NetworkIndicator'
import { Database, Server } from 'lucide-react'

export const EnvironmentChecker = () => {
  if (!config.isDevelopment) {
    return null // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-xs">
      <div className="flex items-center space-x-2 mb-2">
        <Server className="w-4 h-4 text-blue-600" />
        <span className="font-medium">Environment Debug</span>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Environment:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.isDevelopment 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {config.isDevelopment ? 'DEV' : 'PROD'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Network:</span>
          <NetworkIndicator />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Database:</span>
          <span className="text-gray-800 font-mono">
            {config.supabase.projectId ? config.supabase.projectId.slice(-8) : 'N/A'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Web3Auth:</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            config.web3AuthNetwork === 'sapphire_devnet'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-green-100 text-green-800'
          }`}>
            {config.web3AuthNetwork === 'sapphire_devnet' ? 'DEVNET' : 'MAINNET'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default EnvironmentChecker 