"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  customTheme: Theme
  toggleTheme: () => void
  setTheme: (customTheme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProviderCustom({ children }: { children: ReactNode }) {
  const [customTheme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  // Update the customTheme only after component is mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("customTheme") as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.classList.toggle("dark", savedTheme === "dark")
    } else {
      // Check user preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setTheme(prefersDark ? "dark" : "light")
      document.documentElement.classList.toggle("dark", prefersDark)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = customTheme === "dark" ? "light" : "dark"
    setTheme(newTheme)
    localStorage.setItem("customTheme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem("customTheme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  // Only render children when mounted to avoid hydration mismatch
  if (!mounted) {
    return <></>
  }

  return (
    <ThemeContext.Provider value={{ customTheme, toggleTheme, setTheme: setThemeValue }}>{children}</ThemeContext.Provider>
  )
}

export function useCustomTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
