// API service layer for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// API Response Types
interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        phoneNum: string;
        city?: string;
        district?: string;
        lat?: number;
        lng?: number;
    };
}

interface SignupResponse {
    accessToken?: string;
    refreshToken?: string;
    user: {
        id: string;
        name: string;
        phoneNum: string;
        city: string;
        district: string;
    };
    message?: string;
}

interface UserProfile {
    id: string;
    name: string;
    phoneNum: string;
    city?: string;
    district?: string;
    lat?: number;
    lng?: number;
}

interface DistrictsResponse {
    districts: string[];
}

interface CCTVData {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    cctvUrl: string;
    city: string;
    district: string;
    status: boolean;
}

class ApiService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // Member APIs
    async login(phoneNum: string, password: string): Promise<LoginResponse> {
        const response = await fetch(`${API_BASE_URL}/members/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phoneNum, password })
        });
        return this.handleResponse<LoginResponse>(response);
    }

    async signup(userData: {
        name: string;
        phoneNum: string;
        password: string;
        city: string;
        district: string;
    }): Promise<SignupResponse> {
        const response = await fetch(`${API_BASE_URL}/members/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return this.handleResponse<SignupResponse>(response);
    }

    async logout(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/members/me/logout`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async reissueToken(refreshToken: string): Promise<{ accessToken: string; refreshToken?: string }> {
        const response = await fetch(`${API_BASE_URL}/members/auth/reissue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
        });
        return this.handleResponse<{ accessToken: string; refreshToken?: string }>(response);
    }

    async getMyProfile(): Promise<UserProfile> {
        const response = await fetch(`${API_BASE_URL}/members/me`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<UserProfile>(response);
    }

    async updateMyProfile(userData: {
        name?: string;
        phoneNum?: string;
        city?: string;
        district?: string;
    }): Promise<UserProfile> {
        const response = await fetch(`${API_BASE_URL}/members/me`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        return this.handleResponse<UserProfile>(response);
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/members/me/password`, {
            method: 'PATCH',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async getMemberById(id: string): Promise<UserProfile> {
        const response = await fetch(`${API_BASE_URL}/members/${id}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<UserProfile>(response);
    }

    async deleteMemberById(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/members/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async searchMembersByAddress(address: string): Promise<UserProfile[]> {
        const response = await fetch(`${API_BASE_URL}/members/search?address=${encodeURIComponent(address)}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<UserProfile[]>(response);
    }

    // CCTV APIs
    async getAllCCTVs(): Promise<CCTVData[]> {
        const response = await fetch(`${API_BASE_URL}/cctvs`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<CCTVData[]>(response);
    }

    async createOrUpdateCCTV(cctvData: Partial<CCTVData>): Promise<CCTVData> {
        const response = await fetch(`${API_BASE_URL}/cctvs`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(cctvData)
        });
        return this.handleResponse<CCTVData>(response);
    }

    async createCCTVTable(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/cctvs/table`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async deleteCCTVTable(): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/cctvs/table`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async importCCTVFromCSV(csvData: FormData): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/cctvs/import-csv`, {
            method: 'POST',
            headers: {
                ...(localStorage.getItem('accessToken') && { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` })
            },
            body: csvData
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async getCCTVById(id: string): Promise<CCTVData> {
        const response = await fetch(`${API_BASE_URL}/cctvs/${id}`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<CCTVData>(response);
    }

    async deleteCCTVById(id: string): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/cctvs/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ message: string }>(response);
    }

    async getCCTVStreamById(id: string): Promise<{ cctvUrl: string }> {
        const response = await fetch(`${API_BASE_URL}/cctvs/${id}/stream`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<{ cctvUrl: string }>(response);
    }

    async getAllDistricts(): Promise<DistrictsResponse> {
        const response = await fetch(`${API_BASE_URL}/cctvs/districts`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<DistrictsResponse>(response);
    }

    async exportCCTVData() {
        const response = await fetch(`${API_BASE_URL}/cctvs/export`, {
            method: 'POST',
            headers: this.getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.blob(); // Return blob for CSV download
    }
}

export const apiService = new ApiService();