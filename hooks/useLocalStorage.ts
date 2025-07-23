"use client"

import { useState, useEffect, useCallback } from "react"

type SetValue<T> = T | ((val: T) => T)

interface UseLocalStorageOptions {
  serialize?: (value: any) => string
  deserialize?: (value: string) => any
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
): [T, (value: SetValue<T>) => void, () => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
  } = options

  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserialize(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        // Allow value to be a function so we have the same API as useState
        const valueToStore = value instanceof Function ? value(storedValue) : value
        
        // Save state
        setStoredValue(valueToStore)
        
        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, serialize(valueToStore))
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error)
      }
    },
    [key, serialize, storedValue]
  )

  // Remove from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize])

  return [storedValue, setValue, removeValue]
}

// Specialized hook for API endpoint
export function useApiEndpoint(defaultEndpoint: string = "http://localhost:3002") {
  return useLocalStorage("firecrawl-endpoint", defaultEndpoint)
}

// Specialized hook for app settings
export function useAppSettings<T extends Record<string, any>>(defaultSettings: T) {
  return useLocalStorage("firecrawl-settings", defaultSettings)
}

// Hook for managing localStorage with size limits and cleanup
export function useOptimizedLocalStorage<T>(
  key: string,
  initialValue: T[],
  maxItems: number = 50
): [T[], (items: T[]) => void, () => void] {
  const [items, setItems, removeItems] = useLocalStorage(key, initialValue)

  const setOptimizedItems = useCallback((newItems: T[]) => {
    // Limit the number of items
    const limitedItems = newItems.slice(0, maxItems)
    setItems(limitedItems)
  }, [setItems, maxItems])

  return [items, setOptimizedItems, removeItems]
}

// Hook for debounced localStorage updates
export function useDebouncedLocalStorage<T>(
  key: string,
  initialValue: T,
  delay: number = 300
): [T, (value: SetValue<T>) => void, () => void] {
  const [storedValue, setStoredValue, removeValue] = useLocalStorage(key, initialValue)
  const [pendingValue, setPendingValue] = useState<T>(storedValue)

  // Debounce the localStorage update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pendingValue !== storedValue) {
        setStoredValue(pendingValue)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [pendingValue, storedValue, setStoredValue, delay])

  const setValue = useCallback((value: SetValue<T>) => {
    const newValue = value instanceof Function ? value(pendingValue) : value
    setPendingValue(newValue)
  }, [pendingValue])

  return [pendingValue, setValue, removeValue]
}

// Hook for localStorage with compression (for large data)
export function useCompressedLocalStorage<T>(
  key: string,
  initialValue: T,
  compressionThreshold: number = 1024 * 1024 // 1MB
): [T, (value: SetValue<T>) => void, () => void] {
  const serialize = useCallback((value: any) => {
    const jsonString = JSON.stringify(value)
    
    // If the data is large, you could implement compression here
    // For now, we'll just warn about large data
    if (jsonString.length > compressionThreshold) {
      console.warn(`Large data being stored in localStorage (${jsonString.length} bytes)`)
    }
    
    return jsonString
  }, [compressionThreshold])

  return useLocalStorage(key, initialValue, { serialize })
}

// Hook for localStorage with validation
export function useValidatedLocalStorage<T>(
  key: string,
  initialValue: T,
  validator: (value: any) => value is T
): [T, (value: SetValue<T>) => void, () => void] {
  const deserialize = useCallback((value: string) => {
    try {
      const parsed = JSON.parse(value)
      return validator(parsed) ? parsed : initialValue
    } catch {
      return initialValue
    }
  }, [validator, initialValue])

  return useLocalStorage(key, initialValue, { deserialize })
}
