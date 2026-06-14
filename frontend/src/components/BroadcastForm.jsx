import React, { useState } from 'react'
import api from '../services/api'

export default function BroadcastForm() {
  // Broadcast section state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  
  // Test message section state
  const [testPhone, setTestPhone] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [testMessage, setTestMessage] = useState('');
  
  // Shared UI state
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTestSend = async () => {
    if (!testPhone || !testMessage) {
      setFeedback('Phone and message are required for a test send.');
      return;
    }

    setIsLoading(true);
    setFeedback('Sending test message...');

    try {
      const { data } = await api.post('/whatsapp/send-test', {
        phone: testPhone,
        title: testTitle,
        message: testMessage
      });
      setFeedback(`Test message sent: ${data.status}`);
    } catch (error) {
      const messageText = error?.response?.data?.error || error.message || 'Unknown error';
      setFeedback(`Test send failed: ${messageText}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSendNow = async () => {
    if (!broadcastTitle || !broadcastMessage) {
      setFeedback('Title and message are required to broadcast to all members.');
      return;
    }

    setIsLoading(true);
    setFeedback('Sending broadcast to all members...');

    try {
      const { data } = await api.post('/broadcasts/send', {
        title: broadcastTitle,
        message: broadcastMessage,
        send_now: true
      });
      setFeedback(`Broadcast sent to ${data.recipients} members (${data.sent} delivered, ${data.failed} failed).`);
    } catch (error) {
      const messageText = error?.response?.data?.error || error.message || 'Unknown error';
      setFeedback(`Broadcast failed: ${messageText}`);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSchedule = async () => {
    if (!broadcastTitle || !broadcastMessage || !scheduledFor) {
      setFeedback('Title, message, and schedule date are required to schedule a broadcast.');
      return;
    }

    setIsLoading(true);
    setFeedback('Scheduling broadcast...');

    try {
      const { data } = await api.post('/broadcasts/send', {
        title: broadcastTitle,
        message: broadcastMessage,
        scheduled_for: scheduledFor
      });
      setFeedback(`Broadcast scheduled for ${scheduledFor}.`);
    } catch (error) {
      const messageText = error?.response?.data?.error || error.message || 'Unknown error';
      setFeedback(`Schedule failed: ${messageText}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3>Broadcast to all members</h3>
        <input
          type="text"
          placeholder="Broadcast title"
          value={broadcastTitle}
          onChange={e => setBroadcastTitle(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <textarea
          placeholder="Broadcast message"
          value={broadcastMessage}
          onChange={e => setBroadcastMessage(e.target.value)}
          rows={4}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={e => setScheduledFor(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <button onClick={handleSendNow} disabled={isLoading}>Send now to all members</button>
        <button onClick={handleSchedule} disabled={isLoading} style={{ marginLeft: '0.5rem' }}>
          Schedule broadcast
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <h3>Send a test WhatsApp message</h3>
        <input
          type="text"
          placeholder="Phone number (e.g. 254712345678)"
          value={testPhone}
          onChange={e => setTestPhone(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Test message title (optional)"
          value={testTitle}
          onChange={e => setTestTitle(e.target.value)}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <textarea
          placeholder="Test message body"
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          rows={3}
          style={{ width: '100%', marginBottom: '0.5rem' }}
        />
        <button onClick={handleTestSend} disabled={isLoading}>Send test message</button>
      </div>

      {feedback && <div style={{ marginTop: '1rem', color: '#333' }}>{feedback}</div>}
    </div>
  )
}
