import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import {
  Settings as SettingsIcon,
  Bell,
  Lock,
  User,
  Mail,
  Globe,
  Shield,
  Database,
  Server,
  AlertTriangle,
  Save,
  Eye,
  EyeOff,
  Phone,
  CheckCircle,
} from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';
import { supabase } from '@/utils/supabase';

// Different settings categories
type SettingsCategory = 'account' | 'notifications' | 'security' | 'system';

// Settings interface
interface AdminSettings {
  // Account settings
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  profileImage: string | null;
  
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  alertEmails: boolean;
  dailyReports: boolean;
  weeklyReports: boolean;
  
  // Security settings
  twoFactorAuth: boolean;
  sessionTimeout: number;
  
  // System settings
  darkMode: boolean;
  language: string;
  dataRetentionDays: number;
  recoveryPollingInterval: number;
}

const Settings: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('account');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const [settings, setSettings] = useState<AdminSettings>({
    adminName: 'Admin User',
    adminEmail: 'admin@findtracking.com',
    adminPhone: '+1 (555) 123-4567',
    profileImage: null,
    
    emailNotifications: true,
    pushNotifications: true,
    alertEmails: true,
    dailyReports: false,
    weeklyReports: true,
    
    twoFactorAuth: false,
    sessionTimeout: 30,
    
    darkMode: false,
    language: 'en',
    dataRetentionDays: 90,
    recoveryPollingInterval: 15,
  });
  
  // Load settings from local storage on initial load (simulated database)
  useEffect(() => {
    const storedSettings = localStorage.getItem('adminSettings');
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (err) {
        console.error('Error parsing settings:', err);
      }
    }
  }, []);
  
  // Handle settings changes
  const handleSettingChange = (key: keyof AdminSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save to local storage (in a real app, this would be a database call)
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Reset settings
  const resetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        adminName: 'Admin User',
        adminEmail: 'admin@findtracking.com',
        adminPhone: '+1 (555) 123-4567',
        profileImage: null,
        
        emailNotifications: true,
        pushNotifications: true,
        alertEmails: true,
        dailyReports: false,
        weeklyReports: true,
        
        twoFactorAuth: false,
        sessionTimeout: 30,
        
        darkMode: false,
        language: 'en',
        dataRetentionDays: 90,
        recoveryPollingInterval: 15,
      });
    }
  };
  
  return (
    <AdminLayout>
      <Head>
        <title>Settings | FIND Admin Portal</title>
      </Head>
      
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-gray-600">Manage your admin portal preferences and configurations</p>
          </div>
        </div>
        
        {/* Settings layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings navigation */}
          <div className="w-full lg:w-64 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 p-4">
              <h2 className="font-medium text-gray-700">Settings</h2>
            </div>
            <nav className="p-2">
              <button
                onClick={() => setActiveCategory('account')}
                className={`w-full text-left flex items-center p-2 rounded-md ${
                  activeCategory === 'account' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                <span>Account</span>
              </button>
              
              <button
                onClick={() => setActiveCategory('notifications')}
                className={`w-full text-left flex items-center p-2 rounded-md ${
                  activeCategory === 'notifications' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bell className="h-5 w-5 mr-3" />
                <span>Notifications</span>
              </button>
              
              <button
                onClick={() => setActiveCategory('security')}
                className={`w-full text-left flex items-center p-2 rounded-md ${
                  activeCategory === 'security' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Lock className="h-5 w-5 mr-3" />
                <span>Security</span>
              </button>
              
              <button
                onClick={() => setActiveCategory('system')}
                className={`w-full text-left flex items-center p-2 rounded-md ${
                  activeCategory === 'system' ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Server className="h-5 w-5 mr-3" />
                <span>System</span>
              </button>
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={resetSettings}
                className="text-sm text-red-600 hover:text-red-800 flex items-center"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                Reset all settings
              </button>
            </div>
          </div>
          
          {/* Settings content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200 p-4 flex justify-between items-center">
              <h2 className="font-medium text-gray-700">
                {activeCategory === 'account' && 'Account Settings'}
                {activeCategory === 'notifications' && 'Notification Preferences'}
                {activeCategory === 'security' && 'Security Settings'}
                {activeCategory === 'system' && 'System Configuration'}
              </h2>
              <button
                onClick={saveSettings}
                disabled={saving}
                className={`btn-primary flex items-center ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <>
                    <span className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Saving...
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="m-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="p-6">
              {/* Account Settings */}
              {activeCategory === 'account' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={settings.adminName}
                        onChange={(e) => handleSettingChange('adminName', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={settings.adminEmail}
                        onChange={(e) => handleSettingChange('adminEmail', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        value={settings.adminPhone}
                        onChange={(e) => handleSettingChange('adminPhone', e.target.value)}
                        className="input-field"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          defaultValue="password123"
                          className="input-field pr-10"
                          readOnly
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <div className="mt-2">
                        <button className="text-sm text-primary-600 hover:text-primary-800">
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Image</h3>
                    <div className="flex items-center">
                      <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <User className="h-10 w-10" />
                      </div>
                      <div className="ml-5">
                        <button className="btn-outline-primary text-sm px-3 py-1">
                          Upload Image
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          JPG, GIF or PNG. Max size of 800K
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Notification Settings */}
              {activeCategory === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="emailNotifications"
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="emailNotifications" className="font-medium text-gray-700">Email Notifications</label>
                          <p className="text-gray-500">Receive email notifications for important events</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="pushNotifications"
                            type="checkbox"
                            checked={settings.pushNotifications}
                            onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="pushNotifications" className="font-medium text-gray-700">Push Notifications</label>
                          <p className="text-gray-500">Receive browser push notifications</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="alertEmails"
                            type="checkbox"
                            checked={settings.alertEmails}
                            onChange={(e) => handleSettingChange('alertEmails', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="alertEmails" className="font-medium text-gray-700">Alert Emails</label>
                          <p className="text-gray-500">Receive emails for critical alerts and recovery requests</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reports</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="dailyReports"
                            type="checkbox"
                            checked={settings.dailyReports}
                            onChange={(e) => handleSettingChange('dailyReports', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="dailyReports" className="font-medium text-gray-700">Daily Reports</label>
                          <p className="text-gray-500">Receive daily summary reports of all activities</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="weeklyReports"
                            type="checkbox"
                            checked={settings.weeklyReports}
                            onChange={(e) => handleSettingChange('weeklyReports', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="weeklyReports" className="font-medium text-gray-700">Weekly Reports</label>
                          <p className="text-gray-500">Receive weekly summary reports of all activities</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Security Settings */}
              {activeCategory === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="twoFactorAuth"
                            type="checkbox"
                            checked={settings.twoFactorAuth}
                            onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="twoFactorAuth" className="font-medium text-gray-700">Two-Factor Authentication</label>
                          <p className="text-gray-500">Require 2FA for admin login</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Session Settings</h3>
                    <div>
                      <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        id="sessionTimeout"
                        type="number"
                        min="5"
                        max="240"
                        value={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value) || 30)}
                        className="input-field w-full md:w-1/3"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Set how long before an inactive session is automatically logged out
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Login History</h3>
                    <div className="bg-gray-50 p-4 rounded-md text-sm">
                      <p className="text-gray-700">Last login: Today at 08:24 AM from 192.168.1.1</p>
                      <button className="mt-2 text-primary-600 hover:text-primary-800">
                        View Full Login History
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* System Settings */}
              {activeCategory === 'system' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="darkMode"
                            type="checkbox"
                            checked={settings.darkMode}
                            onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                            className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="darkMode" className="font-medium text-gray-700">Dark Mode</label>
                          <p className="text-gray-500">Use dark theme for admin portal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Language</h3>
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Portal Language
                      </label>
                      <select
                        id="language"
                        value={settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="input-field w-full md:w-1/3"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ja">Japanese</option>
                        <option value="id">Indonesian</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="dataRetention" className="block text-sm font-medium text-gray-700 mb-1">
                          Data Retention Period (days)
                        </label>
                        <input
                          id="dataRetention"
                          type="number"
                          min="30"
                          max="365"
                          value={settings.dataRetentionDays}
                          onChange={(e) => handleSettingChange('dataRetentionDays', parseInt(e.target.value) || 90)}
                          className="input-field w-full md:w-1/3"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Set how long to keep location history and other data
                        </p>
                      </div>
                      
                      <div className="mt-4">
                        <label htmlFor="pollingInterval" className="block text-sm font-medium text-gray-700 mb-1">
                          Logistics Polling Interval (minutes)
                        </label>
                        <input
                          id="pollingInterval"
                          type="number"
                          min="5"
                          max="60"
                          value={settings.recoveryPollingInterval}
                          onChange={(e) => handleSettingChange('recoveryPollingInterval', parseInt(e.target.value) || 15)}
                          className="input-field w-full md:w-1/3"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          How often to check for updates on active recovery requests
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Database Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Database Provider</p>
                          <p className="font-medium">Supabase</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Trackers</p>
                          <p className="font-medium">247</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Users</p>
                          <p className="font-medium">182</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Recovery Requests</p>
                          <p className="font-medium">36</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button className="text-primary-600 hover:text-primary-800 text-sm">
                          View Database Status
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Settings;