"use client";
import React, { useState } from 'react';
import AgendaItem from './AgendaItem';

interface Item {
  id: string;
  text: string;
  duration_seconds: number;
}

const initialItems: Item[] = [];

const Agenda: React.FC = () => {
  const [items, setItems] = useState<Item[]>(initialItems);

  const handleSave = (id: string, text: string, duration: number) => {
    setItems(items => items.map(item => item.id === id ? { ...item, text, duration_seconds: duration } : item));
  };

  const handleDelete = (id: string) => {
    setItems(items => items.filter(item => item.id !== id));
  };

  return (
    <div>
      {items.map(item => (
        <AgendaItem key={item.id} item={item} onSave={handleSave} onDelete={handleDelete} />
      ))}
    </div>
  );
};

export default Agenda;