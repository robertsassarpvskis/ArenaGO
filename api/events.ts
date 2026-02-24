import { Event } from './types';



export async function getEvents(): Promise<Event[]> {
  try {
    const res = await fetch('https://690bbdf36ad3beba00f60da2.mockapi.io/api/arenago/v1/events');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch error in getEvents:', err);
    throw err;
  }
}



export async function getEventsByID(id: string): Promise<Event> {
  try {
    const res = await fetch(`https://690bbdf36ad3beba00f60da2.mockapi.io/api/arenago/v1/events/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Fetch error in getEventsByID:', err);
    throw err;
  }
}