import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { API_BASE_URL } from '../api/api';

export function useResourcePolling(resources, setResources) {
  // Keep a mutable reference to the latest resources to avoid stale closures in the SSE listener
  const resourcesRef = useRef(resources);
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

  useEffect(() => {
    // Connect to Server-Sent Events stream
    const eventSource = new EventSource(`${API_BASE_URL}/control/stream`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.topic === 'resource_update') {
          const { resource_id, status } = data.data;
          
          // Read from the mutable ref to evaluate state transition
          const resource = resourcesRef.current.find(r => r.resource_id === resource_id);
          if (!resource) return; // Ignore updates for resources not loaded in this view
          
          const oldState = resource.status.toUpperCase();
          const newState = status.toUpperCase();
          
          if (oldState === newState) return;
          
          // Safely execute side-effects OUTSIDE the React state updater
          if (oldState !== 'RUNNING' && (newState === 'RUNNING' || newState === 'AVAILABLE')) {
            toast.success(`Resource ${resource.name || resource.resource_id} is completely ON!`);
            window.dispatchEvent(new Event('app:refresh-data'));
          } else if (oldState !== 'STOPPED' && (newState === 'STOPPED' || newState === 'PAUSED')) {
            toast.success(`Resource ${resource.name || resource.resource_id} is completely OFF!`);
            window.dispatchEvent(new Event('app:refresh-data'));
          }

          // Update the React state purely
          setResources(prev => prev.map(res => 
            res.resource_id === resource_id ? { ...res, status: newState } : res
          ));
        }
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, [setResources]);
}
