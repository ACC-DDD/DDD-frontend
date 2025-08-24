// Test script to set the access token and test CCTV API connection
// Run this in your browser's console on localhost:3000

// Set the test access token
const testAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTAtODg4OC03Nzc3IiwibWVtYmVySWQiOjMsImlhdCI6MTc1NDYyNjQ1NywiZXhwIjoxNzYyNDAyNDU3fQ.y9ExgN4srrD_q6YlrhlHegwjw5s8B5dWoi9I1lZxtGg";

// Set the token in localStorage
localStorage.setItem('accessToken', testAccessToken);

// Set some dummy user data for member ID 3
const testUserData = {
  id: "3",
  name: "Test User",
  phoneNum: "010-8888-7777",
  city: "서울특별시",
  district: "강남구"
};
localStorage.setItem('userData', JSON.stringify(testUserData));

console.log('✅ Test token and user data set!');
console.log('📱 Phone:', testUserData.phoneNum);
console.log('🆔 Member ID:', testUserData.id);
console.log('🔑 Token set in localStorage');

// Test the API connection
async function testCCTVAPI() {
  try {
    console.log('🔄 Testing CCTV API connection...');
    
    const response = await fetch('/api/proxy/cctvs', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testAccessToken}`
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ CCTV API Success!');
      console.log('📊 Response data:', data);
      console.log('📍 Number of CCTVs:', Array.isArray(data) ? data.length : (data.data ? data.data.length : 'Unknown'));
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ CCTV API Error:', response.status, errorData);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

// Run the test
testCCTVAPI();

console.log('🔄 Now refresh the page to see if the CCTV data loads automatically!');