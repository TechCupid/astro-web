import React, { createContext, useState } from 'react';

export const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const addMessage = (newMessage) => {
    setMessages(prevMessages => [newMessage, ...prevMessages]);
  };

  return (
    <MessageContext.Provider value={{ messages, addMessage }}>
      {children}
    </MessageContext.Provider>
  );
};
