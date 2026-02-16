'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronRight, ChevronLeft, User, Mail, Shield,
  Sparkles, Target, CheckCircle2, X
} from 'lucide-react';
import { getRoleInfo } from '@/config/permissions';

const OnboardingFlow = ({ user, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    avatarColor: user?.avatarColor || 'bg-indigo-500',
    notifyViaWhatsapp: false,
    preferences: {
      emailNotifications: true,
      taskReminders: true,
      weeklyReports: false
    }
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Incrix Studios OS! 🎉',
      description: 'Let\'s get you set up in just a few steps',
      icon: <Sparkles size={48} className="text-indigo-400" />
    },
    {
      id: 'role',
      title: 'Your Role & Permissions',
      description: 'Understand what you can do in the system',
      icon: <Shield size={48} className="text-purple-400" />
    },
    {
      id: 'profile',
      title: 'Complete Your Profile',
      description: 'Help your team recognize you',
      icon: <User size={48} className="text-emerald-400" />
    },
    {
      id: 'preferences',
      title: 'Notification Preferences',
      description: 'Choose how you want to stay updated',
      icon: <Mail size={48} className="text-amber-400" />
    },
    {
      id: 'complete',
      title: 'All Set! 🚀',
      description: 'You\'re ready to start collaborating',
      icon: <CheckCircle2 size={48} className="text-emerald-400" />
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(profileData);
  };

  const avatarColors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500',
    'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500',
    'bg-cyan-500', 'bg-blue-500'
  ];

  const roleInfo = getRoleInfo(user?.role);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1a1a] border border-[#2f2f2f] rounded-2xl w-full max-w-2xl overflow-hidden"
      >
        {/* Progress Bar */}
        <div className="h-2 bg-[#0d0d0d]">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Header */}
        <div className="p-6 border-b border-[#2f2f2f] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Getting Started</h2>
            <p className="text-sm text-[#999] mt-1">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>
          <button
            onClick={onSkip}
            className="text-[#999] hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Welcome Step */}
              {currentStep === 0 && (
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    {steps[0].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {steps[0].title}
                  </h3>
                  <p className="text-[#999] mb-8">
                    {steps[0].description}
                  </p>
                  <div className="bg-[#151515] border border-[#2f2f2f] rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">What you'll learn:</h4>
                    <ul className="space-y-3 text-left">
                      <li className="flex items-start gap-3 text-[#999]">
                        <Check size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Your role and what you can do</span>
                      </li>
                      <li className="flex items-start gap-3 text-[#999]">
                        <Check size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>How to set up your profile</span>
                      </li>
                      <li className="flex items-start gap-3 text-[#999]">
                        <Check size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Customize your notifications</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Role Step */}
              {currentStep === 1 && (
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    {steps[1].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {steps[1].title}
                  </h3>
                  <p className="text-[#999] mb-8">
                    You've been assigned the role of <strong className="text-white">{roleInfo.label}</strong>
                  </p>
                  <div className={`border ${roleInfo.borderColor} ${roleInfo.bgColor} rounded-lg p-6 mb-6`}>
                    <div className={`text-lg font-semibold ${roleInfo.color} mb-2`}>
                      {roleInfo.label}
                    </div>
                    <p className="text-[#999] text-sm">
                      {roleInfo.description}
                    </p>
                  </div>
                  <div className="bg-[#151515] border border-[#2f2f2f] rounded-lg p-6 text-left">
                    <h4 className="text-white font-semibold mb-4">What you can do:</h4>
                    <ul className="space-y-2 text-sm text-[#999]">
                      {getRoleCapabilities(user?.role).map((capability, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Profile Step */}
              {currentStep === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="mb-4 flex justify-center">
                      {steps[2].icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {steps[2].title}
                    </h3>
                    <p className="text-[#999]">
                      {steps[2].description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                        className="w-full bg-[#0d0d0d] text-white border border-[#333] rounded-lg px-4 py-3 outline-none focus:border-indigo-500"
                        placeholder="+1 234 567 8900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Choose Your Avatar Color
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {avatarColors.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setProfileData({ ...profileData, avatarColor: color })}
                            className={`w-12 h-12 rounded-full ${color} ${
                              profileData.avatarColor === color
                                ? 'ring-4 ring-white ring-offset-4 ring-offset-[#1a1a1a]'
                                : 'hover:scale-110'
                            } transition-transform`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-16 h-16 rounded-full ${profileData.avatarColor} flex items-center justify-center text-white text-xl font-bold`}>
                          {profileData.name.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-white font-semibold">{profileData.name || 'Your Name'}</div>
                          <div className="text-sm text-[#999]">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences Step */}
              {currentStep === 3 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="mb-4 flex justify-center">
                      {steps[3].icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {steps[3].title}
                    </h3>
                    <p className="text-[#999]">
                      {steps[3].description}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#151515] border border-[#2f2f2f] rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Email Notifications</div>
                        <div className="text-xs text-[#999]">Get updates via email</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.preferences.emailNotifications}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          preferences: { ...profileData.preferences, emailNotifications: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-[#0d0d0d] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </div>

                    <div className="bg-[#151515] border border-[#2f2f2f] rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Task Reminders</div>
                        <div className="text-xs text-[#999]">Daily reminders for pending tasks</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.preferences.taskReminders}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          preferences: { ...profileData.preferences, taskReminders: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-[#0d0d0d] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </div>

                    <div className="bg-[#151515] border border-[#2f2f2f] rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">Weekly Reports</div>
                        <div className="text-xs text-[#999]">Summary of your weekly activity</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.preferences.weeklyReports}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          preferences: { ...profileData.preferences, weeklyReports: e.target.checked }
                        })}
                        className="w-5 h-5 rounded bg-[#0d0d0d] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </div>

                    <div className="bg-[#151515] border border-[#2f2f2f] rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">WhatsApp Notifications</div>
                        <div className="text-xs text-[#999]">Important updates via WhatsApp</div>
                      </div>
                      <input
                        type="checkbox"
                        checked={profileData.notifyViaWhatsapp}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          notifyViaWhatsapp: e.target.checked
                        })}
                        className="w-5 h-5 rounded bg-[#0d0d0d] border-[#333] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Complete Step */}
              {currentStep === 4 && (
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    {steps[4].icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {steps[4].title}
                  </h3>
                  <p className="text-[#999] mb-8">
                    {steps[4].description}
                  </p>
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-lg p-6 mb-6">
                    <h4 className="text-white font-semibold mb-4">Your Profile Summary</h4>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full ${profileData.avatarColor} flex items-center justify-center text-white text-xl font-bold`}>
                        {profileData.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <div className="text-white font-semibold">{profileData.name}</div>
                        <div className="text-sm text-[#999]">{user?.email}</div>
                        <div className={`text-xs px-2 py-1 rounded ${roleInfo.bgColor} ${roleInfo.color} inline-block mt-1`}>
                          {roleInfo.label}
                        </div>
                      </div>
                    </div>
                    <div className="text-left text-sm text-[#999] space-y-1">
                      <div>✓ {profileData.preferences.emailNotifications ? 'Email notifications enabled' : 'Email notifications disabled'}</div>
                      <div>✓ {profileData.preferences.taskReminders ? 'Task reminders enabled' : 'Task reminders disabled'}</div>
                      <div>✓ {profileData.notifyViaWhatsapp ? 'WhatsApp notifications enabled' : 'WhatsApp notifications disabled'}</div>
                    </div>
                  </div>
                  <p className="text-sm text-[#666]">
                    You can update these settings anytime from your profile.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-[#2f2f2f] flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="px-4 py-2 text-[#999] hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:hover:text-[#999]"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep
                    ? 'bg-indigo-500'
                    : idx < currentStep
                    ? 'bg-indigo-500/50'
                    : 'bg-[#333]'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function to get role capabilities
const getRoleCapabilities = (role) => {
  const capabilities = {
    superadmin: [
      'Full system access and control',
      'User management and role assignment',
      'View analytics and generate reports',
      'Manage system settings and channels',
      'Access all projects and tasks'
    ],
    manager: [
      'Create and manage all content projects',
      'Assign tasks to team members',
      'View team analytics and metrics',
      'Manage channels and workflows',
      'Oversee project completion'
    ],
    creator: [
      'Create new content projects',
      'Edit assigned projects',
      'Complete assigned tasks',
      'Collaborate with team via comments',
      'Create and edit documentation'
    ],
    editor: [
      'Edit assigned content projects',
      'Complete editorial tasks',
      'Provide feedback via comments',
      'Review and refine content',
      'Access project documentation'
    ],
    designer: [
      'View and complete assigned tasks',
      'Daily task management',
      'Track task completion',
      'Collaborate via comments',
      'Focus on design work'
    ],
    developer: [
      'View and complete assigned tasks',
      'Daily task management',
      'Track task completion',
      'Collaborate via comments',
      'Focus on development work'
    ]
  };

  return capabilities[role] || ['View assigned tasks', 'Collaborate with team'];
};

export default OnboardingFlow;
