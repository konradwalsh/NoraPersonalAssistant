import type { Message, AiAnalysis, Task, Obligation, Deadline, Contact, CalendarEvent } from './types';

const API_BASE = '/api'; // Using Vite proxy to forward to http://localhost:7001

export interface MessageUpdate {
  processedAt?: string;
  importance?: string;
  lifeDomain?: string;
}

export class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage = errorData?.error || errorData?.message || response.statusText;
        throw new Error(`API Error (${response.status}): ${errorMessage}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
    }
  }

  async getMessages(): Promise<Message[]> {
    return this.request<Message[]>('/messages');
  }

  async getMessage(id: number): Promise<Message> {
    return this.request<Message>(`/messages/${id}`);
  }

  async updateMessage(id: number, update: MessageUpdate): Promise<Message> {
    return this.request<Message>(`/messages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(update),
    });
  }


  async analyzeMessage(id: number, data?: { instructions?: string }): Promise<any> {
    return this.request(`/messages/${id}/analyze`, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async getMessageExtraction(id: number): Promise<AiAnalysis> {
    return this.request<AiAnalysis>(`/messages/${id}/extraction`);
  }

  async getObligations(): Promise<Obligation[]> {
    return this.request<Obligation[]>('/obligations');
  }

  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks');
  }

  // Deadlines endpoint might not be explicitly mapped yet, but adding it for completeness
  async getDeadlines(): Promise<Deadline[]> {
    return this.request<Deadline[]>('/deadlines');
  }

  async getAppSetting(key: string): Promise<string | null> {
    const settings = await this.request<Record<string, string>>('/settings/app');
    return settings[key] || null;
  }

  async updateAppSetting(key: string, value: string): Promise<void> {
    await this.request('/settings/app', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
  }

  async getContacts(): Promise<Contact[]> {
    return this.request<Contact[]>('/contacts');
  }

  async createContact(contact: Partial<Contact>): Promise<Contact> {
    return this.request<Contact>('/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    });
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return this.request<CalendarEvent[]>('/events');
  }

  async createCalendarEvent(event: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return this.request<CalendarEvent>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }

  async getAttachments(): Promise<Attachment[]> {
    return this.request<Attachment[]>('/attachments');
  }

  async sendChat(message: string): Promise<{ response: string }> {
    return this.request<{ response: string }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }

  async draftReply(id: number, instructions?: string): Promise<{ draft: string }> {
    return this.request<{ draft: string }>(`/messages/${id}/draft`, {
      method: 'POST',
      body: instructions ? JSON.stringify({ instructions }) : undefined
    });
  }

  async getAnalyticsStats(): Promise<any> {
    return this.request('/analytics/stats');
  }

  async getAnalyticsThroughput(timeframe?: string): Promise<any[]> {
    return this.request(`/analytics/throughput?timeframe=${timeframe || '7d'}`);
  }
}

export const apiClient = new ApiClient();