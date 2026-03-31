export class LicenseService {
  constructor() {
    this.tableName = "u_software_license";
  }

  async list(filters = {}) {
    const searchParams = new URLSearchParams(filters);
    searchParams.set('sysparm_display_value', 'all');
    
    try {
      const response = await fetch(`/api/now/table/${this.tableName}?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch licenses: ${response.status}`);
      }
      
      const { result } = await response.json();
      return result || [];
    } catch (error) {
      console.error('Error fetching licenses:', error);
      return [];
    }
  }

  async create(data) {
    try {
      const response = await fetch(`/api/now/table/${this.tableName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create license');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating license:', error);
      throw error;
    }
  }

  async update(sysId, data) {
    try {
      const response = await fetch(`/api/now/table/${this.tableName}/${sysId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update license');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating license:', error);
      throw error;
    }
  }

  async delete(sysId) {
    try {
      const response = await fetch(`/api/now/table/${this.tableName}/${sysId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error deleting license:', error);
      return false;
    }
  }
}