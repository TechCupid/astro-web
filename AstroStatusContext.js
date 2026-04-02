// AstroStatusContext.js
import React, { createContext, useContext, useState } from "react";
import api from './api/apiClient';
import { useApi } from "./ApiContext";

const AstroStatusContext = createContext({});

export const AstroStatusProvider = ({ children }) => {
  const { API_BASE_URL } = useApi();
  const [statuses, setStatuses] = useState([]);

  const fetchStatuses = async () => {
    try {
      const res = await api.get(`${API_BASE_URL}/api/astrologers/status-list`);
      setStatuses(res.data || []);
    } catch (err) {
      console.error("❌ Status fetch failed:", err.message);
    }
  };

  return (
    <AstroStatusContext.Provider value={{ statuses, fetchStatuses }}>
      {children}
    </AstroStatusContext.Provider>
  );
};

export const useAstroStatuses = () => useContext(AstroStatusContext);
