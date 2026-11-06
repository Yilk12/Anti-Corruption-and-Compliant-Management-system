// Stub implementation for KB provider
export function getKBProvider() {
  return {
    search: async (params: any) => {
      console.log('KB search stub:', params);
      return [];
    }
  };
}
