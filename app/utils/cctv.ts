import { getAccessToken } from './auth';
import { CCTVItem } from '../types/database';

export type { CCTVItem };

export const getCCTVList = async (address: string): Promise<CCTVItem[]> => {
  try {
    const response = await fetch(`/api/cctvs?address=${encodeURIComponent(address)}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CCTV list');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching CCTV list:', error);
    throw error;
  }
};

export const getCCTVById = async (id: number): Promise<CCTVItem> => {
  try {
    const response = await fetch(`/api/cctvs/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CCTV details');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching CCTV details:', error);
    throw error;
  }
};

export const getCCTVStream = async (id: number): Promise<string> => {
  try {
    const response = await fetch(`/api/cctvs/${id}/stream`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CCTV stream');
    }

    const data = await response.json();
    return data.streamUrl;
  } catch (error) {
    console.error('Error fetching CCTV stream:', error);
    throw error;
  }
};

export const getCCTVData = async (id: number): Promise<Blob> => {
  try {
    const response = await fetch(`/api/cctvs/${id}/stream`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch CCTV data');
    }

    return response.blob();
  } catch (error) {
    console.error('Error fetching CCTV data:', error);
    throw error;
  }
}; 