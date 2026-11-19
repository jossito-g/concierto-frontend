import { createContext, useContext } from "react";

export const DialogosContext = createContext(null);
export const useDialogos = () => useContext(DialogosContext);