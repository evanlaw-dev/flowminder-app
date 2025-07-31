import { AgendaItemType } from "../stores/useAgendaStore";

export const meetingId = 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Backend returns this shape
type AgendaItemResponse = {
  id: string;
  meeting_id: string;
  agenda_item: string;
  duration_seconds?: number;
};

// Frontend expects this shape
export interface AgendaItemPayload {
  id: string;
  text: string;
  duration_seconds?: number;
}

/**
 * Fetch raw DTOs and map them into { id, text, duration_seconds }
 */
export async function fetchAgendaItemsOnMount(
  meetingId: string
): Promise<AgendaItemPayload[]> {
  const res = await fetch(`${backendUrl}/agenda_items?meeting_id=${meetingId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch agenda items: ${res.status}`);
  }

  const body = (await res.json()) as { items: AgendaItemResponse[] };
  console.debug('Fetched agenda items:', body.items);

  return body.items.map(item => ({
    id: item.id,
    text: item.agenda_item,
    duration_seconds: item.duration_seconds,
  }));
}

/**
 * Save local items (create, update, delete) and refresh
 */
export async function saveItemsToBackend(
  items: AgendaItemType[],
  saveSuccess: (items: AgendaItemType[]) => void
): Promise<AgendaItemType[]> {
  // Partition into create / update / delete
  const toCreate = items.filter(it => it.isNew && !it.isDeleted);
  const toUpdate = items.filter(it => !it.isNew && (it.isEdited || it.isEditedTimer) && !it.isDeleted);
  const toDelete = items.filter(it => it.isDeleted && it.id != null);

  // CREATE
  await Promise.all(
    toCreate.map(item =>
      fetch(`${backendUrl}/agenda_items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          agenda_item: item.text,
          duration_seconds: item.timerValue || 0,
        }),
      })
        .then(async res => {
          if (!res.ok) throw new Error(`POST failed: ${res.status}`);
          const { item: saved } = await res.json();
          item.id = saved.id;
          item.isNew = false;
          console.debug(`CREATED item, got id=`, item.id);
        })
    )
  );

  // UPDATE
  await Promise.all(
    toUpdate.map(async item => {
      console.debug(`--> PATCH /agenda_items/${item.id}`, item);
      const res = await fetch(`${backendUrl}/agenda_items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_item: item.text,
          duration_seconds: item.timerValue || 0,
        }),
      });

      if (res.status === 404) {
        console.warn(`PATCH 404 – item ${item.id} not found (skipping).`);
      } else if (!res.ok) {
        throw new Error(`PATCH failed: ${res.status}`);
      } else {
        item.isEdited = false;
        console.debug(`PATCH succeeded for item ${item.id}`);
      }
    })
  );

  // DELETE
  await Promise.all(
    toDelete.map(async item => {
      console.debug(`→ DELETE /agenda_items/${item.id}`);
      const res = await fetch(`${backendUrl}/agenda_items/${item.id}`, {
        method: 'DELETE',
      });

      if (res.status === 404) {
        console.warn(`DELETE 404 – item ${item.id} not found (skipping).`);
      } else if (!res.ok) {
        throw new Error(`DELETE failed: ${res.status}`);
      } else {
        console.debug(`DELETE succeeded for item ${item.id}`);
      }
    })
  );

  // REFRESH
  const listRes = await fetch(
    `${backendUrl}/agenda_items?meeting_id=${meetingId}`
  );
  if (!listRes.ok) {
    throw new Error(`Failed to fetch updated agenda: ${listRes.status}`);
  }

  const body2 = (await listRes.json()) as { items: AgendaItemResponse[] };
  console.debug('Refreshed agenda items:', body2.items);

  // Map to full AgendaItemType for saveSuccess
  const freshItems: AgendaItemType[] = body2.items.map(item => ({
    id: item.id,
    text: item.agenda_item,
    originalText: item.agenda_item,
    isNew: false,
    isEdited: false,
    isDeleted: false,
    isProcessed: false,
    timerValue: item.duration_seconds ?? 0,
    originalTimerValue: item.duration_seconds ?? 0,
    isEditedTimer: false,
  }));

  // Update store
  saveSuccess(freshItems);
  return freshItems;
}
