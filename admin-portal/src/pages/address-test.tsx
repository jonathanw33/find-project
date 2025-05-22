import React, { useState } from 'react';
import Head from 'next/head';
import AdminLayout from '@/layouts/AdminLayout';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { isValidAddress, getAddressValidationMessage } from '@/utils/addressUtils';
import { CheckCircle, AlertTriangle, MapPin } from 'lucide-react';

const AddressTestPage: React.FC = () => {
  const [address, setAddress] = useState('');

  return (
    <AdminLayout>
      <Head>
        <title>Address Input Test | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Address Input Test</h1>
          <p className="mt-1 text-gray-600">Test the new address autocomplete functionality</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Enhanced Address Input</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shipping Address
              </label>
              <AddressAutocomplete
                value={address}
                onChange={setAddress}
                placeholder="Start typing an address..."
              />
              
              {/* Address validation feedback */}
              {address && (
                <div className="mt-2 flex items-center text-xs">
                  {isValidAddress(address) ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Address looks good</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-amber-600">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>{getAddressValidationMessage(address)}</span>
                    </div>
                  )}
                </div>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                Start typing to search for addresses. Select from the dropdown for accurate delivery.
              </p>
            </div>
            
            {/* Show current value */}
            {address && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Current Address:</h3>
                <p className="text-sm text-gray-700">{address}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Valid: {isValidAddress(address) ? 'Yes' : 'No'}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-medium text-gray-900 mb-4">How it works</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <strong>Free Address Search:</strong> Uses OpenStreetMap's Nominatim service for address autocomplete
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-green-500" />
              <div>
                <strong>Address Validation:</strong> Checks if the address has proper format and components
              </div>
            </div>
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <strong>Smart Suggestions:</strong> Dropdown appears after typing 3+ characters with 300ms debounce
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Try these example searches:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              <li>1600 Pennsylvania Avenue, Washington, DC</li>
              <li>Times Square, New York</li>
              <li>Eiffel Tower, Paris</li>
              <li>Sydney Opera House, Australia</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AddressTestPage;