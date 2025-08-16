import React, { useState, useEffect } from 'react';
import { Timer as TimerIcon, ChevronUp, ChevronDown } from 'lucide-react';

interface TimerProps {
  canEdit: boolean;
  timerValue: number;
  onChangeTimer: (newValue: number) => void;
}

function formatTimer(seconds: number) {
  if (seconds === 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function parseTimerInput(input: string): number {
  if (!input.trim()) return 0;
  if (/^\d+$/.test(input)) return parseInt(input, 10);

  const timeMatch = input.match(/^(\d+):(\d{1,2})$/);
  if (timeMatch) {
    const minutes = parseInt(timeMatch[1], 10);
    const seconds = parseInt(timeMatch[2], 10);
    return minutes * 60 + seconds;
  }

  const naturalMatch = input.match(/^(\d+)([mhs])$/i);
  if (naturalMatch) {
    const value = parseInt(naturalMatch[1], 10);
    const unit = naturalMatch[2].toLowerCase();
    switch (unit) {
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's': return value;
      default: return 0;
    }
  }

  const combinedMatch = input.match(/^(\d+)m(\d+)s$/i);
  if (combinedMatch) {
    const minutes = parseInt(combinedMatch[1], 10);
    const seconds = parseInt(combinedMatch[2], 10);
    return minutes * 60 + seconds;
  }

  const numValue = parseInt(input, 10);
  return isNaN(numValue) ? 0 : numValue;
}

const AgendaTimer: React.FC<TimerProps> = ({ canEdit, timerValue, onChangeTimer }) => {
  const [timerInputValue, setTimerInputValue] = useState('');

  useEffect(() => {
    if (timerValue === 0) {
      setTimerInputValue('');
    } else {
      setTimerInputValue(formatTimer(timerValue));
    }
  }, [timerValue]);

  const handleTimerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimerInputValue(e.target.value);
  };

  const handleTimerBlur = () => {
    const parsedValue = parseTimerInput(timerInputValue);
    onChangeTimer(parsedValue);
    if (parsedValue === 0) {
      setTimerInputValue('');
    } else {
      setTimerInputValue(formatTimer(parsedValue));
    }
  };

  const handleTimerIncrement = (increment: number) => {
    const newValue = Math.max(0, timerValue + increment * 60);
    onChangeTimer(newValue);
  };

  if (canEdit) {
    return (
      <div className="flex justify-end flex-none w-auto">
        <input
          type="text"
          className="w-[7ch] px-1.5 py-1 h-8 border border-gray-300 rounded-l text-xs text-right leading-none
                     focus:outline-none focus:ring-2"
          value={timerInputValue}
          onChange={handleTimerChange}
          onBlur={handleTimerBlur}
          placeholder="0:00"
          title="Enter time as: 5m, 2:30, 1h, or 90s"
        />
        <div className="flex flex-col  border border-gray-300 border-l-0 rounded-r overflow-hidden">
          <button
            type="button"
            onClick={() => handleTimerIncrement(1)}
            className="px-1 text-xs leading-none hover:bg-gray-100"
            title="Add 1 minute"
          >
            <ChevronUp className="w-3.5 h-full" />
          </button>
          <button
            type="button"
            onClick={() => handleTimerIncrement(-1)}
            className="px-1 text-xs leading-none border-t border-gray-300 hover:bg-gray-100"
            title="Subtract 1 minute"
          >
            <ChevronDown className="w-3.5 h-full" />
          </button>
        </div>
      </div>
    );
  } return (
    <div className="flex items-center gap-1 flex-none w-auto px-1.5 py-0.5 text-sm text-gray-600 rounded whitespace-nowrap leading-none h-6">
      <TimerIcon className="w-5 h-5 shrink-0 text-gray-300" />
      {formatTimer(timerValue)}
    </div>
  );
};

export default AgendaTimer;