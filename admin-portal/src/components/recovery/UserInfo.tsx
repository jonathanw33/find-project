import React from 'react';
import { User, Mail, Phone, Home } from 'lucide-react';

interface UserInfoProps {
  name: string;
  email: string;
  phone: string;
  address: string;
}

const UserInfo: React.FC<UserInfoProps> = ({
  name,
  email,
  phone,
  address
}) => {
  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 mr-3">
          <User className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-500">Account Owner</p>
        </div>
      </div>
      
      <ul className="space-y-3">
        <li className="flex">
          <Mail className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
          <span className="text-sm text-gray-700 break-all">{email}</span>
        </li>
        <li className="flex">
          <Phone className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
          <span className="text-sm text-gray-700">{phone}</span>
        </li>
        <li className="flex">
          <Home className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
          <span className="text-sm text-gray-700 whitespace-pre-line">{address}</span>
        </li>
      </ul>
    </div>
  );
};

export default UserInfo;