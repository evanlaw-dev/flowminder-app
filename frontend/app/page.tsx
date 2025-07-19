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
  const [agendaItems, setAgendaItems] = useState<AgendaItemType[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);

  const handleAgendaItemsChange = (items: AgendaItemType[]) => {
    setAgendaItems(items);
  };

  const handleNextItem = () => {
    if (currentItemIndex < agendaItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  // Reset current item index when agenda items change
  useEffect(() => {
    if (agendaItems.length > 0 && currentItemIndex >= agendaItems.length) {
      setCurrentItemIndex(0);
    }
  }, [agendaItems, currentItemIndex]);

  return (
    <main className="max-h-xl min-h-100 py-8 flex flex-col items-center gap-6">
      {/* Current Agenda Item Display */}
      <CurrentAgendaItem 
        agendaItems={agendaItems}
        currentItemIndex={currentItemIndex}
        onNextItem={handleNextItem}
      />

      {/* Agenda List */}
      <Suspense fallback={<div>Loading agenda...</div>}>
        <ClientOnlyAgendaWrapper onAgendaItemsChange={handleAgendaItemsChange} />
      </Suspense>

      {/* Action Buttons */}
      <Nudge />

      {/* Request Display */}
      <DisplayRequests />
    </main>
  );
}
