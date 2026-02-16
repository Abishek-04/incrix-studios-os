'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Instagram,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader,
  AlertCircle,
  Sparkles,
  MessageCircle,
  Zap
} from 'lucide-react';

/**
 * ManyChat-style Instagram Onboarding Wizard
 * Step-by-step flow for connecting Instagram and setting up automations
 */
export default function InstagramOnboarding({ currentUser, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    {
      id: 1,
      title: 'Connect Instagram Account',
      description: 'Connect your Instagram Business Account via Meta',
      icon: Instagram
    },
    {
      id: 2,
      title: 'Verify Connection',
      description: 'Confirm your account is connected successfully',
      icon: CheckCircle
    },
    {
      id: 3,
      title: 'Setup Complete',
      description: 'Your Instagram automation is ready!',
      icon: Sparkles
    }
  ];

  const handleConnectInstagram = async () => {
    if (!currentUser) {
      setError('Please log in first');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      // Redirect to Meta OAuth flow
      window.location.href = `/api/instagram/auth?userId=${currentUser.id}`;
    } catch (err) {
      setError('Failed to initiate connection. Please try again.');
      setConnecting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{
                      scale: currentStep >= step.id ? 1 : 0.8,
                      backgroundColor: currentStep >= step.id ? '#6366f1' : '#2a2a2a'
                    }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      currentStep >= step.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#2a2a2a] text-[#666]'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <div className={`text-xs font-medium ${
                      currentStep >= step.id ? 'text-white' : 'text-[#666]'
                    }`}>
                      Step {step.id}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 h-1 mx-4 relative top-[-20px]">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{
                        scaleX: currentStep > step.id ? 1 : 0,
                        backgroundColor: '#6366f1'
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-indigo-600 origin-left"
                      style={{ width: '100%' }}
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-[#2a2a2a]" style={{ zIndex: -1 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl shadow-2xl overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <Step1ConnectAccount
                connecting={connecting}
                error={error}
                onConnect={handleConnectInstagram}
              />
            )}
            {currentStep === 2 && (
              <Step2VerifyConnection onNext={nextStep} onBack={prevStep} />
            )}
            {currentStep === 3 && (
              <Step3Complete onComplete={onComplete} />
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer Help */}
        <div className="mt-6 text-center text-sm text-[#666]">
          <p>Need help? Check out our <a href="#" className="text-indigo-400 hover:text-indigo-300">setup guide</a></p>
        </div>
      </motion.div>
    </div>
  );
}

// Step 1: Connect Instagram Account
function Step1ConnectAccount({ connecting, error, onConnect }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-12"
    >
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
          <Instagram className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-3">
          Connect Your Instagram Account
        </h2>
        <p className="text-[#999] text-lg max-w-2xl mx-auto">
          Connect your Instagram Business Account through Meta to start automating your DM responses
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Requirements */}
      <div className="mb-8 p-6 bg-[#151515] border border-[#2a2a2a] rounded-xl">
        <h3 className="text-white font-semibold mb-4">Before you connect:</h3>
        <div className="space-y-3">
          {[
            'You have an Instagram Business or Creator Account',
            'Your Instagram account is connected to a Facebook Page',
            'You are an admin of that Facebook Page',
            'You have permissions to manage Instagram messages'
          ].map((req, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-[#999] text-sm">{req}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Button */}
      <button
        onClick={onConnect}
        disabled={connecting}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
      >
        {connecting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Instagram className="w-5 h-5" />
            Connect with Meta
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#666] mt-4">
        By connecting, you agree to Meta's Terms of Service and Privacy Policy
      </p>
    </motion.div>
  );
}

// Step 2: Verify Connection
function Step2VerifyConnection({ onNext, onBack }) {
  const [checking, setChecking] = useState(true);
  const [connected, setConnected] = useState(false);

  // Simulate checking connection
  useState(() => {
    setTimeout(() => {
      setChecking(false);
      setConnected(true);
    }, 2000);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-12"
    >
      <div className="text-center mb-8">
        {checking ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
              <Loader className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Verifying Connection...
            </h2>
            <p className="text-[#999] text-lg">
              Please wait while we verify your Instagram account connection
            </p>
          </>
        ) : connected ? (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 mx-auto mb-6 bg-green-600 rounded-2xl flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Successfully Connected!
            </h2>
            <p className="text-[#999] text-lg">
              Your Instagram account is now connected and ready for automation
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-red-600/20 rounded-2xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Connection Failed
            </h2>
            <p className="text-[#999] text-lg">
              We couldn't verify your Instagram connection. Please try again.
            </p>
          </>
        )}
      </div>

      {connected && (
        <div className="mb-8 p-6 bg-[#151515] border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">@yourusername</h3>
              <p className="text-[#666] text-sm">Business Account</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2a2a2a]">
            <div>
              <div className="text-[#666] text-xs mb-1">Followers</div>
              <div className="text-white font-semibold">10.5K</div>
            </div>
            <div>
              <div className="text-[#666] text-xs mb-1">Posts</div>
              <div className="text-white font-semibold">234</div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-[#2a2a2a] text-white rounded-xl font-semibold hover:bg-[#333] transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!connected}
          className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
        >
          Continue
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

// Step 3: Setup Complete
function Step3Complete({ onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-12"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>
        <h2 className="text-3xl font-bold text-white mb-3">
          You're All Set!
        </h2>
        <p className="text-[#999] text-lg max-w-2xl mx-auto">
          Your Instagram automation is ready. Start creating automation rules to automatically respond to comments with DMs.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-6 bg-[#151515] border border-[#2a2a2a] rounded-xl hover:border-indigo-500/50 transition-colors cursor-pointer group">
          <MessageCircle className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-2">Create Automation</h3>
          <p className="text-[#666] text-sm">Set up your first comment → DM automation</p>
        </div>
        <div className="p-6 bg-[#151515] border border-[#2a2a2a] rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
          <Zap className="w-8 h-8 text-purple-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-white font-semibold mb-2">Browse Templates</h3>
          <p className="text-[#666] text-sm">Use pre-built automation templates</p>
        </div>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all flex items-center justify-center gap-3"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
