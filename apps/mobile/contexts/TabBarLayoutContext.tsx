import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabBarLayout {
  /** Distance from the bottom of the screen to the top of the tab bar container */
  topOffset: number;
}

const TabBarLayoutContext = createContext<TabBarLayout>({ topOffset: 0 });
const TabBarLayoutSetterContext = createContext<(offset: number) => void>(() => {});

export function TabBarLayoutProvider({ children }: { children: React.ReactNode }) {
  const [topOffset, setTopOffset] = useState(0);

  const updateOffset = useCallback((offset: number) => {
    setTopOffset((prev) => (prev === offset ? prev : offset));
  }, []);

  return (
    <TabBarLayoutContext.Provider value={{ topOffset }}>
      <TabBarLayoutSetterContext.Provider value={updateOffset}>
        {children}
      </TabBarLayoutSetterContext.Provider>
    </TabBarLayoutContext.Provider>
  );
}

/** Returns the distance from the bottom of the screen to the top of the tab bar */
export function useTabBarLayout(): TabBarLayout {
  return useContext(TabBarLayoutContext);
}

/** Used by CustomTabBar to report its measured position */
export function useSetTabBarLayout() {
  return useContext(TabBarLayoutSetterContext);
}
