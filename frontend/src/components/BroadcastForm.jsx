// frontend/src/components/BroadcastForm.jsx
import React, { useState } from 'react';
import api from '../services/api';

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
      {/* Broadcast to all members section */}
      <div style={{ marginBottom: 'var(--spacing-36)' }}>
        <h2 style={{ 
          fontSize: 'var(--text-subheading)', 
          marginBottom: 'var(--spacing-20)',
          fontFamily: 'var(--font-polysans)',
          fontWeight: 'var(--font-weight-semibold)'
        }}>
          Broadcast to all members
        </h2>
        
        <input
          type="text"
          className="input"
          placeholder="Broadcast title (e.g., Hate watch Arsenal)"
          value={broadcastTitle}
          onChange={e => setBroadcastTitle(e.target.value)}
          style={{ marginBottom: 'var(--spacing-16)' }}
        />
        
        <textarea
          className="input"
          placeholder="Broadcast message"
          value={broadcastMessage}
          onChange={e => setBroadcastMessage(e.target.value)}
          rows={4}
          style={{ marginBottom: 'var(--spacing-16)' }}
        />
        
        <input
          type="datetime-local"
          className="input"
          value={scheduledFor}
          onChange={e => setScheduledFor(e.target.value)}
          style={{ marginBottom: 'var(--spacing-20)' }}
        />
        
        <div style={{ display: 'flex', gap: 'var(--spacing-16)', flexWrap: 'wrap' }}>
          <button 
            className="btn-primary" 
            onClick={handleSendNow} 
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            Send now to all members
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSchedule} 
            disabled={isLoading}
            style={{ 
              opacity: isLoading ? 0.7 : 1,
              backgroundColor: 'var(--color-slate)' // different color for schedule button
            }}
          >
            Schedule broadcast
          </button>
        </div>
      </div>

      <hr style={{ margin: 'var(--spacing-36) 0', borderColor: 'var(--color-chalk)' }} />

      {/* Send a test WhatsApp message section */}
      <div>
        <h2 style={{ 
          fontSize: 'var(--text-subheading)', 
          marginBottom: 'var(--spacing-20)',
          fontFamily: 'var(--font-polysans)',
          fontWeight: 'var(--font-weight-semibold)'
        }}>
          Send a test WhatsApp message
        </h2>
        
        <input
          type="text"
          className="input"
          placeholder="Phone number (e.g., 254712345678)"
          value={testPhone}
          onChange={e => setTestPhone(e.target.value)}
          style={{ marginBottom: 'var(--spacing-16)' }}
        />
        
        <input
          type="text"
          className="input"
          placeholder="Test message title (optional)"
          value={testTitle}
          onChange={e => setTestTitle(e.target.value)}
          style={{ marginBottom: 'var(--spacing-16)' }}
        />
        
        <textarea
          className="input"
          placeholder="Test message body"
          value={testMessage}
          onChange={e => setTestMessage(e.target.value)}
          rows={3}
          style={{ marginBottom: 'var(--spacing-20)' }}
        />
        
        <button 
          className="btn-primary" 
          onClick={handleTestSend} 
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          Send test message
        </button>
      </div>

      {feedback && (
        <div style={{ 
          marginTop: 'var(--spacing-20)', 
          padding: 'var(--spacing-12) var(--spacing-16)',
          backgroundColor: 'var(--surface-fog)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--color-carbon)',
          fontFamily: 'var(--font-inter)',
          fontSize: 'var(--text-caption)'
        }}>
          {feedback}
        </div>
      )}
    </div>
  );
}