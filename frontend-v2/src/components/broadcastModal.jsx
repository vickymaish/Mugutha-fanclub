import { useState } from 'react'
import './BroadcastModal.css'

export default function BroadcastModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button className="btn-broadcast" onClick={() => setIsOpen(true)}>
        New Broadcast
      </button>
      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Broadcast</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="title">Broadcast Title</label>
                  <input type="text" id="title" placeholder="Enter broadcast title" />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea id="message" placeholder="Enter your message" rows="5"></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="recipients">Recipients</label>
                  <input type="text" id="recipients" placeholder="Select recipients" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsOpen(false)}>Cancel</button>
              <button className="btn-submit">Send Broadcast</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
