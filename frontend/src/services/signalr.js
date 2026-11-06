import * as signalR from '@microsoft/signalr';
import { getAuthToken } from './api';

let connection = null;
const eventListeners = new Map();

export function getSignalRConnection() {
  if (connection) return connection;

  connection = new signalR.HubConnectionBuilder()
    .withUrl('/hubs/notifications', {
      accessTokenFactory: () => getAuthToken() || '',
      skipNegotiation: false,
      transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  // Attach handlers
  const events = ['TicketCreated', 'TicketAssigned', 'TicketStatusChanged', 'ApprovalPending', 'TicketClosed'];
  events.forEach((eventName) => {
    connection.on(eventName, (data) => {
      const callbacks = eventListeners.get(eventName) || [];
      callbacks.forEach((cb) => cb(data));
    });
  });

  return connection;
}

export async function startSignalR() {
  const conn = getSignalRConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    try {
      await conn.start();
      console.log('[SignalR] Connected successfully to factory notification hub');
    } catch (err) {
      console.warn('[SignalR] Connection failed, will retry automatically:', err);
    }
  }
}

export function subscribeToNotification(eventName, callback) {
  if (!eventListeners.has(eventName)) {
    eventListeners.set(eventName, []);
  }
  eventListeners.get(eventName).push(callback);

  return () => {
    const list = eventListeners.get(eventName) || [];
    eventListeners.set(
      eventName,
      list.filter((cb) => cb !== callback)
    );
  };
}

