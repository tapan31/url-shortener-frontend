import { createContext, useContext, useState } from "react";

const ContextApi = createContext();

export const ContextProvider = ({ children }) => {
  const getToken = localStorage.getItem("ACCESS_TOKEN");
  // ? JSON.parse(localStorage.getItem("ACCESS_TOKEN"))
  // : null;

  const [token, setToken] = useState(getToken);

  // logout handler
  const logout = () => {
    localStorage.removeItem("ACCESS_TOKEN");
    localStorage.removeItem("REFRESH_TOKEN");
    setToken(null);
    // window.location.href = "/login";
  };

  const sendData = {
    token,
    setToken,
    logout,
  };

  return <ContextApi.Provider value={sendData}>{children}</ContextApi.Provider>;
};

export const useStoreContext = () => {
  const context = useContext(ContextApi);
  if (!context) {
    throw new Error("useStoreContext must be used within ContextProvider");
  }
  return context;
};
