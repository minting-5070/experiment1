'use client';

import { useState } from 'react';

type Settings = {
  model: string;
  temperature: number;
  maxTokens: number;
};

type Props = {
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
  isOpen: boolean;
  onClose: () => void;
};

const AVAILABLE_MODELS = [
  { value: 'gpt-35-turbosctrict', label: 'GPT-3.5 Turbo Strict (빠름, 경제적)' },
];

export default function SettingsPanel({ settings, onSettingsChange, isOpen, onClose }: Props) {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">설정</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* 모델 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">AI 모델</label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, model: e.target.value }))}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              창의성 (Temperature): {localSettings.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>정확함</span>
              <span>균형</span>
              <span>창의적</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium mb-2">
              최대 토큰 수: {localSettings.maxTokens}
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={localSettings.maxTokens}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>짧음</span>
              <span>중간</span>
              <span>길음</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleReset}
            className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
          >
            초기화
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
} 