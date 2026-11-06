// Stub implementation for helpdesk provider
export function getHelpDeskProvider() {
  return {
    createTicket: async (data: any) => {
      console.log('Helpdesk ticket creation stub:', data);
      return { id: 'stub-ticket-id', ...data };
    }
  };
}
