"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Gender } from "./types";

const GenderContext = createContext<{
  gender: Gender;
  setGender: (g: Gender) => void;
}>({ gender: "dam", setGender: () => {} });

export function GenderProvider({ children }: { children: ReactNode }) {
  const [gender, setGender] = useState<Gender>("dam");
  return (
    <GenderContext.Provider value={{ gender, setGender }}>
      {children}
    </GenderContext.Provider>
  );
}

export function useGender() {
  return useContext(GenderContext);
}
