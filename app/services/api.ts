// API service layer for backend integration
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? '/api/proxy' // Use proxy in development to bypass CORS
  : (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://43.203.156.19:8080');

// API Response Types based on Swagger documentation
interface LoginResponse {
    memberId: number;
    name: string;
    accessToken: string;
    refreshToken: string;
}

interface SignupResponse {
    id: number;
    name: string;
    phoneNum: string;
    city: string;
    district: string;
    detail?: string;
    verified: boolean;
}

interface UserProfile {
    id: number;
    name: string;
    phoneNum: string;
    city?: string;
    district?: string;
    detail?: string;
    verified: boolean;
}

interface CCTVData {
    id: string;
    name: string;
    cctvUrl: string;
    city: string;
    district: string;
    town?: string;
    status: boolean;
}

interface DistrictsResponse {
    districts: string[];
}

class ApiService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    private async handleResponse<T>(response: Response, originalRequest?: () => Promise<Response>): Promise<T> {
        const responseData = await response.json().catch(() => ({}));
        
        if (!response.ok) {
            // Handle 401 Unauthorized - attempt token refresh
            if (response.status === 401 && originalRequest) {
                console.log('🔄 Token expired, attempting refresh...');
                const refreshToken = localStorage.getItem('refreshToken');
                
                if (refreshToken) {
                    try {
                        const refreshResponse = await fetch(`${API_BASE_URL}/members/auth/reissue`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refreshToken })
                        });
                        
                        if (refreshResponse.ok) {
                            const refreshData = await refreshResponse.json();
                            const newTokens = refreshData.success ? refreshData.data : refreshData;
                            
                            // Update tokens
                            localStorage.setItem('accessToken', newTokens.accessToken);
                            if (newTokens.refreshToken) {
                                localStorage.setItem('refreshToken', newTokens.refreshToken);
                            }
                            
                            console.log('✅ Token refreshed successfully, retrying original request...');
                            
                            // Retry original request with new token
                            const retryResponse = await originalRequest();
                            return this.handleResponse<T>(retryResponse);
                        }
                    } catch (refreshError) {
                        console.error('❌ Token refresh failed:', refreshError);
                        // Clear invalid tokens
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('userData');
                    }
                }
            }
            
            const errorMessage = responseData.message || `HTTP error! status: ${response.status}`;
            console.error(`API Error (${response.status}):`, errorMessage);
            throw new Error(errorMessage);
        }
        
        // Backend wraps all responses in {success, code, message, data} format
        if (responseData.success && responseData.data !== undefined) {
            return responseData.data;
        }
        
        // Fallback for responses without data wrapper
        return responseData;
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
        const requestData = {
            name: userData.name,
            phoneNum: userData.phoneNum,
            password: userData.password,
            confirmPassword: userData.password, // Backend expects confirmPassword
            city: userData.city,
            district: userData.district
        };
        
        const response = await fetch(`${API_BASE_URL}/members/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
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
        const makeRequest = () => fetch(`${API_BASE_URL}/cctvs`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        
        const response = await makeRequest();
        return this.handleResponse<CCTVData[]>(response, makeRequest);
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

    async getAllDistricts(): Promise<string[]> {
        const response = await fetch(`${API_BASE_URL}/cctvs/districts`, {
            method: 'GET',
            headers: this.getAuthHeaders()
        });
        return this.handleResponse<string[]>(response);
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