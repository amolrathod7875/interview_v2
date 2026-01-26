import { create } from 'zustand'

export const TabStore = create((set) => ({
    trigger: false,

    setTrigger: () => {
        set({ trigger: true })
    }
}))
