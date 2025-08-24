"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, RefreshCw, Camera } from "lucide-react"
import { apiService } from "../services/api"

interface DisasterLocation {
  id: number
  name: string
  time: string
  location: string
  type: string
  status: string
  cctvUrl?: string
  city?: string
  district?: string
}

export default function DisasterSimulationPage() {
  const router = useRouter()
  const [disasterLocations, setDisasterLocations] = useState<DisasterLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDisasters = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      console.log('🔄 Fetching real CCTV disaster data from backend...')

      // Fetch all CCTV data from backend
      const cctvData = await apiService.getAllCCTVs()
      console.log('✅ CCTV data received:', cctvData)

      // Filter CCTVs where status is false (disaster occurred)
      const disasterCCTVs = cctvData.filter(cctv => cctv.status === false)
      console.log('🚨 Disaster CCTVs found:', disasterCCTVs)

      // Convert CCTV data to disaster location format
      const disasters: DisasterLocation[] = disasterCCTVs.map(cctv => ({
        id: parseInt(cctv.id) || Math.random(),
        name: `${cctv.name} - 재난 감지`,
        time: new Date().toLocaleString('ko-KR'), // Current time as detection time
        location: `${cctv.city} ${cctv.district}`,
        type: "재난감지", // Generic disaster type from CCTV
        status: "진행중",
        cctvUrl: cctv.cctvUrl,
        city: cctv.city,
        district: cctv.district
      }))

      setDisasterLocations(disasters)
      setError(null)

      console.log(`📊 Found ${disasters.length} disaster locations`)

    } catch (err) {
      console.error('❌ Error fetching disaster data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch disaster data')

      // If API fails, show empty state instead of mock data
      setDisasterLocations([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case "진행중":
      case "신규발생":
        return "bg-red-100 text-red-800 border-red-200"
      case "대응완료":
        return "bg-green-100 text-green-800 border-green-200"
      case "모니터링중":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  useEffect(() => {
    fetchDisasters()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            지도로 돌아가기
          </Button>
          <Card>
            <CardContent className="p-8">
              <div className="text-center">데이터를 불러오는 중...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            className="mb-6"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            지도로 돌아가기
          </Button>
          <Card>
            <CardContent className="p-8">
              <div className="text-center text-red-600">오류: {error}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.push('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          지도로 돌아가기
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-6 w-6" />
                재난 발생 지역
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchDisasters(true)}
                  disabled={refreshing}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? '새로고침 중...' : '새로고침'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {disasterLocations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  현재 발생한 재난이 없습니다.
                </div>
              ) : (
                disasterLocations.map((location) => (
                  <div
                    key={location.id}
                    className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{location.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.status)}`}>
                        {location.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">발생 시간:</span> {location.time}
                      </p>
                      <p>
                        <span className="font-medium">위치:</span> {location.location}
                      </p>
                      <p>
                        <span className="font-medium">유형:</span>
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${location.type === '화재' ? 'bg-red-100 text-red-700' :
                          location.type === '지진' ? 'bg-orange-100 text-orange-700' :
                            location.type === '홍수' ? 'bg-blue-100 text-blue-700' :
                              location.type === '가스누출' ? 'bg-purple-100 text-purple-700' :
                                'bg-red-100 text-red-700'
                          }`}>
                          {location.type}
                        </span>
                      </p>
                    </div>
                    {location.cctvUrl && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(location.cctvUrl, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Camera className="h-4 w-4" />
                          CCTV 영상 보기
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {disasterLocations.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">총 {disasterLocations.length}건의 재난 상황이 감지되었습니다.</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 