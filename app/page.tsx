"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, User, LogOut, RefreshCw, Database, Wifi } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { apiService } from "./services/api"
import { authManager } from "./utils/auth"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"

interface Location {
  id: number
  name: string
  address: string
  lat: number
  lng: number
  detection: "normal" | "disaster"
  cctvUrl: string
}

// Fetch CCTV locations from backend API endpoint /cctvs
async function fetchCCTVLocations(): Promise<Location[]> {
  console.log('🔄 Attempting to fetch CCTV data from backend API /cctvs...')
  try {
    const response = await apiService.getAllCCTVs()
    console.log('✅ Successfully fetched CCTV data from backend:', response)
    console.log('📊 Number of CCTVs received:', Array.isArray(response) ? response.length : 0)

    // Check if we have valid CCTV data
    if (Array.isArray(response) && response.length > 0) {
      const mappedLocations = response.map((item: any, index: number) => {
        console.log(`🎥 Processing CCTV ${index + 1}:`, {
          id: item.id,
          name: item.name,
          status: item.status,
          city: item.city,
          district: item.district,
          latitude: item.latitude,
          longitude: item.longitude
        })

        return {
          id: parseInt(item.id) || Math.random(),
          name: item.name || `CCTV ${item.id || index + 1}`,
          address: `${item.city || ''} ${item.district || ''}`.trim() || '위치 정보 없음',
          lat: parseFloat(item.latitude) || 37.5665, // Use latitude from backend
          lng: parseFloat(item.longitude) || 126.9780, // Use longitude from backend
          detection: (item.status === false ? "disaster" : "normal") as "normal" | "disaster", // false status means disaster
          cctvUrl: item.cctvUrl || "/placeholder.jpg"
        }
      })

      const disasterCount = mappedLocations.filter(loc => loc.detection === "disaster").length
      const normalCount = mappedLocations.filter(loc => loc.detection === "normal").length

      console.log(`📈 CCTV Status Summary:`)
      console.log(`   🟢 Normal: ${normalCount}`)
      console.log(`   🔴 Disaster: ${disasterCount}`)
      console.log(`   📍 Total: ${mappedLocations.length}`)

      return mappedLocations
    } else {
      console.log('⚠️ No CCTV data received from backend, using sample data...')
      throw new Error('No CCTV data available from backend')
    }
  } catch (error) {
    console.error('❌ Error fetching CCTV locations from backend:', error)
    console.log('🔄 Using sample data as fallback (backend may require authentication)...')

    // Return sample data for testing when backend is not available
    const sampleData = [
      {
        id: 1,
        name: "강남역 CCTV (샘플)",
        address: "서울특별시 강남구 강남대로 396",
        lat: 37.4979,
        lng: 127.0276,
        detection: "normal" as const,
        cctvUrl: "/placeholder.jpg"
      },
      {
        id: 2,
        name: "홍대입구역 CCTV (샘플)",
        address: "서울특별시 마포구 양화로 160",
        lat: 37.5563,
        lng: 126.9236,
        detection: "normal" as const,
        cctvUrl: "/placeholder.jpg"
      },
      {
        id: 3,
        name: "명동역 CCTV (샘플 - 재난)",
        address: "서울특별시 중구 명동길 26",
        lat: 37.5636,
        lng: 126.9834,
        detection: "disaster" as const,
        cctvUrl: "/placeholder.jpg"
      },
      {
        id: 4,
        name: "이태원역 CCTV (샘플)",
        address: "서울특별시 용산구 이태원로 177",
        lat: 37.5345,
        lng: 126.9945,
        detection: "normal" as const,
        cctvUrl: "/placeholder.jpg"
      },
      {
        id: 5,
        name: "잠실역 CCTV (샘플)",
        address: "서울특별시 송파구 올림픽로 240",
        lat: 37.5133,
        lng: 127.1000,
        detection: "normal" as const,
        cctvUrl: "/placeholder.jpg"
      }
    ]

    console.log('📋 Sample data loaded:', sampleData.length, 'CCTVs')
    return sampleData
  }
}

// Dynamic import for the map components with better error handling and timeout
const MapWithNoSSR = dynamic(() => import('@/components/Map').catch(() => {
  // Fallback component if map fails to load
  return {
    default: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <p className="text-red-500 mb-2">지도를 불러올 수 없습니다</p>
          <Button onClick={() => window.location.reload()}>페이지 새로고침</Button>
        </div>
      </div>
    )
  }
}), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-500">지도를 불러오는 중...</p>
        <p className="text-xs text-gray-400 mt-2">잠시만 기다려주세요</p>
      </div>
    </div>
  ),
})

export default function DisasterDetectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCamera, setSelectedCamera] = useState<Location | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [isLoadingCCTV, setIsLoadingCCTV] = useState(false)
  const [isUsingRealData, setIsUsingRealData] = useState(false)

  const handleSelectCamera = (location: Location) => {
    setSelectedCamera(location)
  }

  const loadCCTVData = async (showToast = false) => {
    setIsLoadingCCTV(true)
    try {
      console.log('🔄 Loading CCTV data from backend API /cctvs...')
      console.log('🔐 Authentication status:', authManager.isAuthenticated())
      console.log('🔑 Access token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...')

      const response = await apiService.getAllCCTVs()

      // Enhanced debugging
      console.log('🔍 Raw API Response:', response)
      console.log('🔍 Response type:', typeof response)
      console.log('🔍 Is Array?', Array.isArray(response))
      console.log('🔍 Response length:', Array.isArray(response) ? response.length : 'Not an array')
      console.log('🔍 Response keys:', response ? Object.keys(response) : 'No response')

      if (Array.isArray(response) && response.length > 0) {
        // Successfully got real data from backend
        setIsUsingRealData(true)
        const mappedLocations = response.map((item: any, index: number) => ({
          id: parseInt(item.id) || Math.random(),
          name: item.name || `CCTV ${item.id || index + 1}`,
          address: `${item.city || ''} ${item.district || ''}`.trim() || '위치 정보 없음',
          lat: parseFloat(item.latitude) || 37.5665,
          lng: parseFloat(item.longitude) || 126.9780,
          detection: (item.status === false ? "disaster" : "normal") as "normal" | "disaster",
          cctvUrl: item.cctvUrl || "/placeholder.jpg"
        }))

        setLocations(mappedLocations)

        const disasterCount = mappedLocations.filter(loc => loc.detection === "disaster").length
        console.log(`✅ Real CCTV data loaded: ${mappedLocations.length} total, ${disasterCount} disasters`)

        if (showToast) {
          toast({
            title: "CCTV 데이터 업데이트 완료",
            description: `${mappedLocations.length}개 CCTV 중 ${disasterCount}개 재난 감지`,
          })
        }
      } else {
        throw new Error('No CCTV data available')
      }
    } catch (error) {
      console.error('❌ Failed to load real CCTV data:', error)
      setIsUsingRealData(false)

      // Check if it's an authentication error
      const isAuthError = error instanceof Error && error.message.includes('인증에 실패했습니다')

      // Use sample data as fallback
      const sampleData = [
        {
          id: 1,
          name: "강남역 CCTV (샘플)",
          address: "서울특별시 강남구 강남대로 396",
          lat: 37.4979,
          lng: 127.0276,
          detection: "normal" as const,
          cctvUrl: "/placeholder.jpg"
        },
        {
          id: 2,
          name: "홍대입구역 CCTV (샘플)",
          address: "서울특별시 마포구 양화로 160",
          lat: 37.5563,
          lng: 126.9236,
          detection: "normal" as const,
          cctvUrl: "/placeholder.jpg"
        },
        {
          id: 3,
          name: "명동역 CCTV (샘플 - 재난)",
          address: "서울특별시 중구 명동길 26",
          lat: 37.5636,
          lng: 126.9834,
          detection: "disaster" as const,
          cctvUrl: "/placeholder.jpg"
        },
        {
          id: 4,
          name: "이태원역 CCTV (샘플)",
          address: "서울특별시 용산구 이태원로 177",
          lat: 37.5345,
          lng: 126.9945,
          detection: "normal" as const,
          cctvUrl: "/placeholder.jpg"
        },
        {
          id: 5,
          name: "잠실역 CCTV (샘플)",
          address: "서울특별시 송파구 올림픽로 240",
          lat: 37.5133,
          lng: 127.1000,
          detection: "normal" as const,
          cctvUrl: "/placeholder.jpg"
        }
      ]

      setLocations(sampleData)
      console.log('📋 Sample data loaded as fallback')

      if (showToast) {
        if (isAuthError) {
          toast({
            title: "인증이 필요합니다",
            description: "실시간 CCTV 데이터를 보려면 로그인해주세요. 현재 샘플 데이터를 표시합니다.",
            variant: "destructive",
          })
        } else if (error instanceof Error && error.message.includes('시간 초과')) {
          toast({
            title: "백엔드 서버 연결 실패",
            description: "서버가 응답하지 않습니다. 샘플 데이터를 표시합니다.",
            variant: "destructive",
          })
        } else {
          toast({
            title: "백엔드 연결 실패",
            description: "샘플 데이터를 표시합니다. 잠시 후 다시 시도해주세요.",
            variant: "destructive",
          })
        }
      }
    } finally {
      setIsLoadingCCTV(false)
    }
  }

  useEffect(() => {
    // Check authentication status
    const isAuthenticated = authManager.isAuthenticated()
    setIsLoggedIn(isAuthenticated)

    if (isAuthenticated) {
      const userData = authManager.getUserData()
      if (userData && userData.lat && userData.lng) {
        setUserLocation({
          lat: userData.lat,
          lng: userData.lng
        })
      }
    }

    // Load initial CCTV data
    loadCCTVData()

    const handleDisaster = (e: CustomEvent<{ locations: Location[] }>) => {
      setLocations(e.detail.locations)
    }

    window.addEventListener("disasterDetected", handleDisaster as EventListener)
    return () => {
      window.removeEventListener("disasterDetected", handleDisaster as EventListener)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await authManager.logout()
      setIsLoggedIn(false)
      toast({
        title: "로그아웃 완료",
        description: "로그아웃되었습니다.",
      })
      router.push("/")
    } catch (error) {
      console.error('Error during logout:', error)
      // Still clear local state even if API call fails
      authManager.clearAuth()
      setIsLoggedIn(false)
      router.push("/")
    }
  }



  return (
    <div className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto relative">
        <div className="absolute z-[1000] top-4 left-4">
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            onClick={() => router.push('/disaster-simulation')}
          >
            재난 시뮬레이션
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
          {/* Test Token Button - for development */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwMTAtODg4OC03Nzc3IiwibWVtYmVySWQiOjMsImlhdCI6MTc1NDYyNjQ1NywiZXhwIjoxNzYyNDAyNDU3fQ.y9ExgN4srrD_q6YlrhlHegwjw5s8B5dWoi9I1lZxtGg";
                localStorage.setItem('accessToken', testToken);
                localStorage.setItem('userData', JSON.stringify({
                  id: "3",
                  name: "Test User",
                  phoneNum: "010-8888-7777",
                  city: "서울특별시",
                  district: "강남구"
                }));
                setIsLoggedIn(true);
                toast({
                  title: "테스트 토큰 설정 완료",
                  description: "Member ID 3 토큰으로 로그인되었습니다.",
                });
                loadCCTVData(true);
              }}
              className="flex items-center gap-2"
            >
              🔑 테스트 토큰
            </Button>
          )}

          {/* CCTV Data Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadCCTVData(true)}
            disabled={isLoadingCCTV}
            className="flex items-center gap-2"
            title={!isLoggedIn ? "로그인 후 실시간 데이터를 확인할 수 있습니다" : "CCTV 데이터 새로고침"}
          >
            <RefreshCw className={`h-4 w-4 ${isLoadingCCTV ? 'animate-spin' : ''}`} />
            CCTV 새로고침
          </Button>

          {/* Data Source Indicator */}
          <div className={`px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 ${isUsingRealData
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
            }`}>
            {isUsingRealData ? (
              <>
                <Database className="h-3 w-3" />
                실시간 데이터
              </>
            ) : (
              <>
                <Wifi className="h-3 w-3" />
                샘플 데이터
              </>
            )}
          </div>

          {isLoggedIn ? (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/profile')}
              >
                <User className="h-4 w-4" />
                프로필
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => router.push('/login')}
              >
                로그인
              </Button>
              <Button
                className="font-semibold"
                onClick={() => router.push('/signup')}
              >
                회원가입
              </Button>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden aspect-square relative">
          <div className="h-full w-full">
            <MapWithNoSSR
              locations={locations}
              onSelectCamera={handleSelectCamera}
              center={userLocation ? [userLocation.lat, userLocation.lng] : undefined}
            />
          </div>

          <Dialog open={!!selectedCamera} onOpenChange={() => setSelectedCamera(null)}>
            <DialogContent className="max-w-3xl z-[9999]">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    {selectedCamera?.name}
                    {selectedCamera?.detection === "disaster" && (
                      <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                        재난 발생
                      </span>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>
              <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                {selectedCamera?.detection === "disaster" ? (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img src={selectedCamera.cctvUrl} alt="재난 CCTV 화면" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></div>
                        <span className="text-white text-sm font-mono">실시간</span>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <span className="text-white text-sm font-mono bg-black/50 px-2 py-1 rounded">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-black">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <img src={selectedCamera?.cctvUrl} alt="정상 CCTV 화면" className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-white text-sm font-mono">실시간</span>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <span className="text-white text-sm font-mono bg-black/50 px-2 py-1 rounded">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
