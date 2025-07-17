import { useState, useEffect, useRef } from 'react';

export interface MenuItem {
  id: string;
  label: string;
  action?: () => void;
  submenu?: MenuItem[];
}

export interface MenuState {
  isOpen: boolean;
  activeMenu: string | null;
  position: { x: number; y: number };
}

export function useMenu() {
  const [menuState, setMenuState] = useState<MenuState>({
    isOpen: false,
    activeMenu: null,
    position: { x: 0, y: 0 }
  });
  
  const menuRef = useRef<HTMLDivElement>(null);
  
  const openMenu = (menuId: string, x: number, y: number) => {
    setMenuState({
      isOpen: true,
      activeMenu: menuId,
      position: { x, y }
    });
  };
  
  const closeMenu = () => {
    setMenuState(prev => ({ ...prev, isOpen: false, activeMenu: null }));
  };
  
  const toggleMenu = (menuId: string, x: number, y: number) => {
    if (menuState.isOpen && menuState.activeMenu === menuId) {
      closeMenu();
    } else {
      openMenu(menuId, x, y);
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    
    if (menuState.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuState.isOpen]);
  
  return {
    menuState,
    menuRef,
    openMenu,
    closeMenu,
    toggleMenu
  };
}