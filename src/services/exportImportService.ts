import apiService from './api';

class ExportImportService {
  /**
   * Get base URL from apiService
   */
  private getBaseUrl(): string {
    return process.env.REACT_APP_API_URL || 'https://kasir-pos-api.sunnflower.site/api/v1';
  }

  /**
   * Get auth token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Export data ke Excel atau PDF
   */
  async export(type: string, format: 'excel' | 'pdf', params: Record<string, any> = {}): Promise<void> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const url = `${this.getBaseUrl()}/export/${type}/${format}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    try {
      const token = this.getToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': format === 'excel' 
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Export failed' }));
        throw new Error(errorData.message || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get filename from Content-Disposition header or generate default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${type}_${format}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      throw new Error(error.message || 'Export failed');
    }
  }

  /**
   * Download template untuk import
   */
  async downloadTemplate(type: string): Promise<void> {
    const url = `${this.getBaseUrl()}/export/template/${type}`;
    
    try {
      const token = this.getToken();
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Template download failed' }));
        throw new Error(errorData.message || `Template download failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `template_import_${type}_${Date.now()}.xlsx`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      throw new Error(error.message || 'Template download failed');
    }
  }

  /**
   * Import data dari file
   */
  async import(type: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch directly for multipart/form-data
    const url = `${this.getBaseUrl()}/import/${type}`;
    const token = this.getToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await response.json();
    return {
      success: response.ok && data.success !== false,
      data: data.data || data,
      message: data.message || (response.ok ? 'Success' : 'Import failed'),
    };
  }

  /**
   * Preview import data
   */
  async previewImport(type: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    // Use fetch directly for multipart/form-data
    const url = `${this.getBaseUrl()}/import/${type}/preview`;
    const token = this.getToken();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });

    const data = await response.json();
    return {
      success: response.ok && data.success !== false,
      data: data.data || data,
      message: data.message || (response.ok ? 'Success' : 'Preview failed'),
    };
  }
}

export const exportImportService = new ExportImportService();
export default exportImportService;

