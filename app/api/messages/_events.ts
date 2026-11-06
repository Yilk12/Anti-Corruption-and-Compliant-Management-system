type Client = { id: string; send: (data: string) => void };

const clients = new Set<Client>();

export function addClient(c: Client) {
  clients.add(c);
}

export function removeClient(c: Client) {
  clients.delete(c);
}

export function broadcast(event: string, payload: any) {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const c of clients) {
    try { c.send(data); } catch {}
  }
}

export function clientCount() { return clients.size; }
