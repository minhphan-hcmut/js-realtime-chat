import { WebSocket } from "ws";

const clients = new Map();

function register(uid, ws) {
    if (!clients.has(uid)) {
        clients.set(uid, new Set());
    }
    clients.get(uid).add(ws);
    console.log(`[WS] ${uid} connected. Total devices: ${clients.get(uid).size}`)
}


function unregister(uid, ws) {
    const connections = clients.get(uid);
    if (!connections) return;

    connections.delete(ws);

    if (connections.size === 0) {
        clients.delete(uid);
    }

    console.log(`[WS] ${uid} disconnected. Remainming devices: ${connections?.size || 0}`);
}

function broadcastToChannel(memberUids, payload) {
    const data = JSON.stringify(payload);

    for (const uid of memberUids) {
        const connections = clients.get(uid);
        if (!connections) continue;
        for (const ws of connections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        }
    }
}

export { register, unregister, broadcastToChannel };