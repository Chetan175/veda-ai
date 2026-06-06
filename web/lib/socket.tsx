'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useParams } from 'next/navigation';
import { getAssignment, listAssignments } from './api';
import { useAssignmentStore } from './store';

let socketSingleton: Socket | null = null;

function getSocket(): Socket {
  if (!socketSingleton) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    socketSingleton = io(apiBaseUrl, {
      autoConnect: false,
      transports: ['websocket'],
      withCredentials: true
    });
  }
  return socketSingleton;
}

export function SocketBridge() {
  const params = useParams<{ id?: string }>();
  const rawAssignmentId = params?.id;
  const assignmentId =
    typeof rawAssignmentId === 'string'
      ? rawAssignmentId
      : Array.isArray(rawAssignmentId)
        ? rawAssignmentId[0] ?? null
        : null;
  const activeAssignmentId = useAssignmentStore((state) => state.activeAssignmentId);
  const setAssignments = useAssignmentStore((state) => state.setAssignments);
  const upsertAssignment = useAssignmentStore((state) => state.upsertAssignment);
  const removeAssignment = useAssignmentStore((state) => state.removeAssignment);
  const setActiveAssignmentId = useAssignmentStore((state) => state.setActiveAssignmentId);
  const setSocketStatus = useAssignmentStore((state) => state.setSocketStatus);
  const socketRef = useRef<Socket | null>(null);
  const assignmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveAssignmentId(assignmentId);
    assignmentIdRef.current = assignmentId;
  }, [assignmentId, setActiveAssignmentId]);

  useEffect(() => {
    let alive = true;

    async function hydrate() {
      try {
        const assignments = await listAssignments();
        if (alive) {
          setAssignments(assignments);
        }
      } catch {
        // Ignore initial fetch failures; the screen still renders from local state.
      }
    }

    void hydrate();

    const socket = getSocket();
    socketRef.current = socket;
    setSocketStatus('connecting');
    socket.connect();

    const onConnect = () => {
      setSocketStatus('connected');
      if (assignmentIdRef.current) {
        socket.emit('assignment:subscribe', assignmentIdRef.current);
      }
    };
    const onDisconnect = () => setSocketStatus('disconnected');
    const onCreated = (record: unknown) => upsertAssignment(record as Parameters<typeof upsertAssignment>[0]);
    const onUpdated = (record: unknown) => upsertAssignment(record as Parameters<typeof upsertAssignment>[0]);
    const onDeleted = (id: string) => removeAssignment(id);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('assignment:created', onCreated);
    socket.on('assignment:updated', onUpdated);
    socket.on('assignment:deleted', onDeleted);

    return () => {
      alive = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('assignment:created', onCreated);
      socket.off('assignment:updated', onUpdated);
      socket.off('assignment:deleted', onDeleted);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [removeAssignment, setAssignments, setSocketStatus, upsertAssignment]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || !assignmentId) {
      return;
    }

    socket.emit('assignment:subscribe', assignmentId);
    return () => {
      socket.emit('assignment:unsubscribe', assignmentId);
    };
  }, [assignmentId, activeAssignmentId]);

  useEffect(() => {
    if (!assignmentId) {
      return;
    }

    void getAssignment(assignmentId)
      .then((record) => upsertAssignment(record))
      .catch(() => {
        // Allow the page to render while the socket catches up.
      });
  }, [assignmentId, upsertAssignment]);

  return null;
}
