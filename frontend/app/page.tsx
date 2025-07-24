'use client'
import React, { useState, useEffect } from 'react';
import './globals.css';

const initialAgenda = [
  { id: '1', text: 'Discuss project timeline', duration_seconds: 1200 },
  { id: '2', text: 'Review budget', duration_seconds: 900 },
  { id: '3', text: 'Assign action items', duration_seconds: 600 },
  { id: '4', text: 'Q&A', duration_seconds: 300 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Home() {
  const [agenda, setAgenda] = useState(initialAgenda);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [editMinutes, setEditMinutes] = useState(0);
  const [editSeconds, setEditSeconds] = useState(0);
  const [moveAlongCount, setMoveAlongCount] = useState(0);
  const [extraTimeCount, setExtraTimeCount] = useState(0);
  const [nudgeCount, setNudgeCount] = useState(0);

  // Add state for current timer edit mode and timer running
  const [isCurrentTimerEditing, setIsCurrentTimerEditing] = useState(false);
  const [currentTimerValue, setCurrentTimerValue] = useState(agenda[currentIdx].duration_seconds);
  const [currentTimerRunning, setCurrentTimerRunning] = useState(false);
  const [currentEditHours, setCurrentEditHours] = useState(0);
  const [currentEditMinutes, setCurrentEditMinutes] = useState(0);
  const [currentEditSeconds, setCurrentEditSeconds] = useState(0);

  // Add state for new agenda item
  const [isAddingNewItem, setIsAddingNewItem] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const [newItemHours, setNewItemHours] = useState(0);
  const [newItemMinutes, setNewItemMinutes] = useState(0);
  const [newItemSeconds, setNewItemSeconds] = useState(0);

  // Timer effect for current agenda item
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (currentTimerRunning && !isCurrentTimerEditing) {
      interval = setInterval(() => {
        setCurrentTimerValue((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentTimerRunning, isCurrentTimerEditing]);

  // Sync timer value with agenda change
  useEffect(() => {
    setCurrentTimerValue(agenda[currentIdx].duration_seconds);
  }, [agenda, currentIdx]);

  // Enter edit mode for a row
  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditText(agenda[idx].text);
    setEditMinutes(Math.floor(agenda[idx].duration_seconds / 60));
    setEditSeconds(agenda[idx].duration_seconds % 60);
  };

  // Save edits
  const handleSave = (idx: number) => {
    const updated = [...agenda];
    updated[idx] = {
      ...updated[idx],
      text: editText,
      duration_seconds: editMinutes * 60 + editSeconds,
    };
    setAgenda(updated);
    setEditIdx(null);
  };

  // Cancel edit
  const handleCancel = () => setEditIdx(null);

  // Move to next agenda item
  const handleNext = () => {
    setCurrentIdx((idx) => (idx + 1 < agenda.length ? idx + 1 : 0));
  };

  // Nudge Speaker increments move along
  const handleNudgeSpeaker = () => setMoveAlongCount(c => c + 1);
  // Request Extra Time increments extra time
  const handleRequestExtraTime = () => setExtraTimeCount(c => c + 1);

  // Add reset counts handler
  const handleResetCounts = () => {
    setMoveAlongCount(0);
    setExtraTimeCount(0);
    setNudgeCount(0);
  };

  const handleAddNewItem = () => {
    setIsAddingNewItem(true);
    setNewItemText("");
    setNewItemHours(0);
    setNewItemMinutes(0);
    setNewItemSeconds(0);
  };

  const handleSaveNewItem = () => {
    const totalSeconds = newItemHours * 3600 + newItemMinutes * 60 + newItemSeconds;
    if (newItemText.trim() === "" && totalSeconds === 0) {
      setIsAddingNewItem(false);
      return;
    }
    setAgenda(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newItemText,
        duration_seconds: totalSeconds,
      },
    ]);
    setIsAddingNewItem(false);
  };

  const handleCancelNewItem = () => {
    setIsAddingNewItem(false);
  };

  return (
    <div className="main-bg">
      <div className="main-card wide">
        <div className="header">Host Version</div>
        <div className="flex flex-col items-start mb-6">
          <div className="current-topic">{agenda[currentIdx].text}</div>
          <div className="flex items-center gap-2 timer-row mb-4">
            {isCurrentTimerEditing ? (
              <>
                <input type="number" value={currentEditHours} min={0} max={23} onChange={e => setCurrentEditHours(Number(e.target.value))} className="timer-input" style={{width: 40}} />:
                <input type="number" value={currentEditMinutes} min={0} max={59} onChange={e => setCurrentEditMinutes(Number(e.target.value))} className="timer-input" style={{width: 40}} />:
                <input type="number" value={currentEditSeconds} min={0} max={59} onChange={e => setCurrentEditSeconds(Number(e.target.value))} className="timer-input" style={{width: 40}} />
                <button className="save-button ml-2" onClick={() => {
                  const newVal = currentEditHours * 3600 + currentEditMinutes * 60 + currentEditSeconds;
                  setCurrentTimerValue(newVal);
                  setIsCurrentTimerEditing(false);
                }}>Save</button>
                <button className="cancel-button ml-1" onClick={() => setIsCurrentTimerEditing(false)}>Cancel</button>
              </>
            ) : (
              <>
                <span className="timer" style={{cursor: 'pointer'}} onClick={() => {
                  setCurrentEditHours(Math.floor(currentTimerValue / 3600));
                  setCurrentEditMinutes(Math.floor((currentTimerValue % 3600) / 60));
                  setCurrentEditSeconds(currentTimerValue % 60);
                  setIsCurrentTimerEditing(true);
                }}>{formatTime(currentTimerValue)}</span>
                <button className="start-pause-btn ml-2" onClick={() => setCurrentTimerRunning(r => !r)}>
                  {currentTimerRunning ? 'Pause' : 'Start'}
                </button>
              </>
            )}
          </div>
          <div className="action-buttons-row flex gap-3 w-full mb-4">
            <button onClick={handleNudgeSpeaker} className="action-btn large">Nudge Speaker</button>
            <button onClick={handleNext} className="action-btn large">Move to next item</button>
            <button onClick={handleRequestExtraTime} className="action-btn large">Request extra time</button>
          </div>
        </div>

        <div className="agenda-list mb-6">
          <div className="agenda-title">Agenda</div>
          {agenda.map((item, index) => (
            <div key={item.id} className="agenda-item-row flex items-center gap-2 mb-2">
              {editIdx === index ? (
                <>
                  <input type="text" value={editText} onChange={e => setEditText(e.target.value)} className="edit-input" />
                  <div className="timer-inputs flex items-center gap-1">
                    <input type="number" value={editMinutes} min={0} max={59} onChange={e => setEditMinutes(Number(e.target.value))} className="timer-input" style={{width: 32}} />:
                    <input type="number" value={editSeconds} min={0} max={59} onChange={e => setEditSeconds(Number(e.target.value))} className="timer-input" style={{width: 32}} />
                  </div>
                  <button onClick={() => handleSave(index)} className="agenda-save-btn large ml-2">Save</button>
                  <button onClick={handleCancel} className="agenda-cancel-btn large ml-1">Cancel</button>
                </>
              ) : (
                <>
                  <span className="agenda-item-text">{item.text}</span>
                  <span className="agenda-item-time agenda-timer-box ml-2">{formatTime(item.duration_seconds)}</span>
                  <button onClick={() => handleEdit(index)} className="agenda-change-btn large ml-2">Change</button>
                </>
              )}
            </div>
          ))}
          {isAddingNewItem ? (
            <div className="agenda-item-row">
              <input
                type="text"
                className="edit-input"
                placeholder="Agenda item text"
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                style={{ minWidth: 180 }}
              />
              <div className="timer-inputs">
                <input
                  type="number"
                  className="timer-input"
                  min={0}
                  max={23}
                  value={newItemHours}
                  onChange={e => setNewItemHours(Number(e.target.value))}
                  placeholder="hh"
                />:
                <input
                  type="number"
                  className="timer-input"
                  min={0}
                  max={59}
                  value={newItemMinutes}
                  onChange={e => setNewItemMinutes(Number(e.target.value))}
                  placeholder="mm"
                />:
                <input
                  type="number"
                  className="timer-input"
                  min={0}
                  max={59}
                  value={newItemSeconds}
                  onChange={e => setNewItemSeconds(Number(e.target.value))}
                  placeholder="ss"
                />
              </div>
              <button className="save-button large" onClick={handleSaveNewItem}>Save</button>
              <button className="cancel-button large" onClick={handleCancelNewItem}>Cancel</button>
            </div>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              <button className="change-button large" onClick={handleAddNewItem}>New agenda item</button>
            </div>
          )}
        </div>

        <div className="counters-section flex flex-col items-center gap-2">
          <div className="flex gap-4 mb-2">
            <div className="counter-box">Requests to move along: {moveAlongCount}</div>
            <div className="counter-box">Requests for extra time: {extraTimeCount}</div>
          </div>
          <button className="reset-counts-btn mt-2" onClick={handleResetCounts}>Reset counts</button>
        </div>
      </div>
    </div>
  );
}
