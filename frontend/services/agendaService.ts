import { AgendaItemType } from "../stores/useAgendaStore";

export async function saveItemsToBackend(
  items: AgendaItemType[],
  saveSuccess: (items: AgendaItemType[]) => void
): Promise<AgendaItemType[]> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
  const meetingId = 'a8f52a02-5aa8-45ec-9549-79ad2a194fa4';

  // 1) Partition into create / update / delete
  const toCreate = items.filter(it => it.isNew && !it.isDeleted);
  const toUpdate = items.filter(it => !it.isNew && it.isEdited && !it.isDeleted);
  const toDelete = items.filter(it => it.isDeleted && it.id != null);

  // 2) CREATE new items
  await Promise.all(
    toCreate.map(item =>
      fetch(`${backendUrl}/agenda_items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id:       meetingId,
          agenda_item:      item.text,
          duration_seconds: item.newTimerValue || 0
        })
      })
      .then(async res => {
        if (!res.ok) throw new Error(`POST failed: ${res.status}`);
        const { item: saved } = await res.json();
        item.id = saved.id;
        item.isNew = false;
        console.debug(`CREATED item, got id=`, item.id, `(type: ${typeof item.id})`);
      })
    )
  );

  // 3) UPDATE edited items (tolerate 404 as “that row’s already gone”)
  await Promise.all(
    toUpdate.map(async item => {
      console.debug(`→ PATCH /agenda_items/${item.id}`, {
        id: item.id,
        type: typeof item.id,
        text: item.text,
        duration: item.newTimerValue
      });

      const res = await fetch(`${backendUrl}/agenda_items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenda_item:      item.text,
          duration_seconds: item.newTimerValue || 0
        })
      });

      if (res.status === 404) {
        console.warn(`PATCH 404 – item ${item.id} not found (OK to skip).`);
      } else if (!res.ok) {
        throw new Error(`PATCH failed: ${res.status}`);
      } else {
        item.isEdited = false;
        console.debug(`PATCH succeeded for item ${item.id}`);
      }
    })
  );

  // 4) DELETE removed items (also tolerate 404)
  await Promise.all(
    toDelete.map(async item => {
      console.debug(`→ DELETE /agenda_items/${item.id}`);
      const res = await fetch(`${backendUrl}/agenda_items/${item.id}`, {
        method: 'DELETE'
      });

      if (res.status === 404) {
        console.warn(`DELETE 404 – item ${item.id} not found (OK to skip).`);
      } else if (!res.ok) {
        throw new Error(`DELETE failed: ${res.status}`);
      } else {
        console.debug(`DELETE succeeded for item ${item.id}`);
      }
    })
  );

  // 5) REFRESH the full list from the server
  const listRes = await fetch(`${backendUrl}/agenda_items?meeting_id=${meetingId}`);
  if (!listRes.ok) {
    throw new Error(`Failed to fetch updated agenda: ${listRes.status}`);
  }
  const { items: freshItems } = await listRes.json();

  // 6) UPDATE your UI/store
  saveSuccess(freshItems);
  return freshItems;
}
