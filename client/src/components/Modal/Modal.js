import React from "react";

function Modal({ children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        {children}
      </div>
    </div>
  );
}

export default Modal;
