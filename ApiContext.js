import React, { createContext, useState, useContext, useEffect } from 'react';
import { setApiBaseUrl } from './api/apiClient';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {

  const [API_BASE_URL, setApiBaseUrlState] =
    useState('http://10.90.61.118:8090/astroapi');

  useEffect(() => {
    setApiBaseUrl(API_BASE_URL);
  }, [API_BASE_URL]);

  const changeApiBaseUrl = (newUrl) => {
    setApiBaseUrlState(newUrl);
  };

  return (
    <ApiContext.Provider value={{ API_BASE_URL, changeApiBaseUrl }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = () => {
  return useContext(ApiContext);
};