import { AgendaItemType } from "../stores/useAgendaStore";

export async function saveItemsToBackend(
  items: AgendaItemType[],
  saveSuccess: (items: AgendaItemType[]) => void
) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const meetingId = 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4';

  // 1. Delete ALL items from backend for this meeting
  await fetch(`${backendUrl}/agenda?meeting_id=${meetingId}`, {
    method: 'DELETE',
  });

  // 2. Save all non-deleted items by re-POSTing them
  const itemsToSave = items.filter(it => !it.isDeleted && !it.isProcessed && it.text.trim() !== "");
  const savedItems: AgendaItemType[] = [];

  for (const item of itemsToSave) {
    try {
      const response = await fetch(`${backendUrl}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          agenda_item: item.text,
          duration_seconds: item.newTimerValue || 0
        })
      });

      const result = await response.json();
      console.log('Saved agenda item:', result);

      savedItems.push({
        ...item,
        id: result.id || item.id, // Use backend ID
        originalText: item.text,
        originalTimerValue: item.newTimerValue || 0,
        timerValue: item.newTimerValue || 0,
        newTimerValue: item.newTimerValue || 0,
        isNew: false,
        isEdited: false,
        isDeleted: false,
        isProcessed: false,
        isEditedTimer: false,
      });
    } catch (error) {
      console.error('Error saving agenda item:', error);
    }
  }

  // Update the store with the saved items
  saveSuccess(savedItems);

  return savedItems;
}
