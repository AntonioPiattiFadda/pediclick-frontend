import React, { createContext, useState } from "react";

interface SearchContextType {
  searchedCategory: string;
  setSearchedCategory: React.Dispatch<React.SetStateAction<string>>;
  searchString: string;
  setSearchString: React.Dispatch<React.SetStateAction<string>>;
}

export const SearchContext = createContext<SearchContextType>({
  searchedCategory: "",
  setSearchedCategory: () => {},
  searchString: "",
  setSearchString: () => {},
});

const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchString, setSearchString] = useState("");
  const [searchedCategory, setSearchedCategory] = useState("");
  const data = {
    searchedCategory,
    setSearchedCategory,
    searchString,
    setSearchString,
  };
  return (
    <SearchContext.Provider value={data}>{children}</SearchContext.Provider>
  );
};

export default SearchContextProvider;
