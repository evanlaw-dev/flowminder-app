'use client'
import Agenda from '@/components/Agenda';
import DisplayRequests from '@/components/DisplayRequests';
import CurrentAgendaItem from '@/components/CurrentAgendaItem';
import Nudge from '@/components/Nudge';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

interface AgendaItemType {
  id: string;
  text: string;
  originalText: string;
  isNew: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  timer_value?: number;
  is_running?: boolean;
  last_updated?: string;
  initial_value?: number;
  duration_seconds?: number;
}

function ClientOnlyAgendaWrapper({ onAgendaItemsChange }: { onAgendaItemsChange: (items: AgendaItemType[]) => void }) {
  const searchParams = useSearchParams();

  // TODO change default role to 'participant'. currently set to 'host' for testing purposes
  const role = searchParams.get('role') === 'participant' ? 'participant' : 'host';
  // default is participant on this line
  // const role = searchParams.get('role') === 'host' ? 'host' : 'participant'; 
  return <Agenda role={role} onAgendaItemsChange={onAgendaItemsChange} />;
}

export default function Home() {
  const [currentAgendaItem, setCurrentAgendaItem] = useState<AgendaItemType | undefined>();

  const handleAgendaItemsChange = (items: AgendaItemType[]) => {
    // Set the first non-deleted item as the current item
    const firstItem = items.find(item => !item.isDeleted && item.text.trim() !== '');
    setCurrentAgendaItem(firstItem);
  };

  return (
    <main className="max-h-xl min-h-100 py-8 flex flex-col items-center w-full max-w-md gap-3 px-4 mx-auto">
      <CurrentAgendaItem currentItem={currentAgendaItem} />
      <Nudge />

      <Suspense fallback={<div>Loading agenda…</div>}>
        <ClientOnlyAgendaWrapper onAgendaItemsChange={handleAgendaItemsChange} />
      </Suspense>

      <DisplayRequests />
    </main>
  );
}
