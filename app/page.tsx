"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, AlertTriangle, User, LogOut } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
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

// Fetch CCTV locations from backend
async function fetchCCTVLocations(): Promise<Location[]> {
  try {
    const response = await fetch('/api/cctvs')
    if (!response.ok) {
      throw new Error('Failed to fetch CCTV locations')
    }
    const data = await response.json()
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lng),
      detection: item.detection === "disaster" ? "disaster" : "normal",
      cctvUrl: item.cctvUrl
    }))
  } catch (error) {
    console.error('Error fetching CCTV locations:', error)
    return [] // Return empty array instead of sample data
  }
}

// Dynamic import for the map components
const MapWithNoSSR = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-gray-500">지도를 불러오는 중...</p>
    </div>
  ),
})

export default function DisasterDetectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedCamera, setSelectedCamera] = useState<Location | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)

  const handleSelectCamera = (location: Location) => {
    setSelectedCamera(location)
  }

  useEffect(() => {
    const userData = localStorage.getItem('userData')
    if (userData) {
      try {
        const data = JSON.parse(userData)
        setIsLoggedIn(true)
        if (data.lat && data.lng) {
          setUserLocation({ 
            lat: parseFloat(data.lat), 
            lng: parseFloat(data.lng) 
          })
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
      }
    }

    // Fetch initial CCTV locations
    fetchCCTVLocations().then(setLocations)

    const handleDisaster = (e: CustomEvent<{ locations: Location[] }>) => {
      setLocations(e.detail.locations)
    }

    window.addEventListener("disasterDetected", handleDisaster as EventListener)
    return () => {
      window.removeEventListener("disasterDetected", handleDisaster as EventListener)
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('userData')
    setIsLoggedIn(false)
    toast({
      title: "로그아웃 완료",
      description: "로그아웃되었습니다.",
    })
    router.push("/")
  }

  const handleDisasterSimulation = () => {
    try {
      router.push('/disaster-simulation')
    } catch (error) {
      console.error('Navigation error:', error)
      // Fallback to window.location if router.push fails
      window.location.href = '/disaster-simulation'
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto relative">
        <div className="absolute z-[1000] top-4 left-4">
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            // onClick={handleDisasterSimulation}
            onClick={() => router.push('/disaster-simulation')}
          >
            {/* <AlertTriangle className="h-4 w-4" /> */}
            재난 시뮬레이션
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-[1000] flex gap-2">
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
