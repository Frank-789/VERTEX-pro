import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: ToolCall[]
  dataSources?: DataSource[]
  timestamp: number
}

export interface ToolCall {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed'
  platform?: string
  duration?: number
  dataCount?: number
  details?: string
}

export interface DataSource {
  label: string
  type: 'realtime' | 'user_upload' | 'cached' | 'estimated'
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  addMessage: (message: Message) => void
  updateLastAssistant: (updates: Partial<Message>) => void
  setStreaming: (streaming: boolean) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateLastAssistant: (updates) =>
    set((state) => {
      const msgs = [...state.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'assistant') {
          msgs[i] = { ...msgs[i], ...updates }
          break
        }
      }
      return { messages: msgs }
    }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  clearMessages: () => set({ messages: [] }),
}))
