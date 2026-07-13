import '@testing-library/jest-dom/vitest'

// jsdom non implementa matchMedia: stub minimale per i componenti che lo usano.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}

// localStorage polyfill per tests
if (typeof global.localStorage === 'undefined') {
  const store: Record<string, string> = {}
  global.localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    },
    length: Object.keys(store).length,
  } as Storage
}
