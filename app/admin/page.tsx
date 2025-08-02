"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Download, Upload, Trash2 } from "lucide-react"
import { apiService } from "../services/api"
import { authManager } from "../utils/auth"

interface CCTV {
    id: string
    name: string
    address: string
    lat: number
    lng: number
    cctvUrl: string
    city: string
    district: string
    status: boolean
}

export default function AdminPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [cctvs, setCctvs] = useState<CCTV[]>([])
    const [loading, setLoading] = useState(true)
    const [districts, setDistricts] = useState<string[]>([])

    useEffect(() => {
        if (!authManager.isAuthenticated()) {
            router.push('/login')
            return
        }

        fetchCCTVs()
        fetchDistricts()
    }, [router])

    const fetchCCTVs = async () => {
        try {
            const response = await apiService.getAllCCTVs()
            setCctvs(response)
        } catch (error) {
            console.error('Error fetching CCTVs:', error)
            toast({
                title: "CCTV 데이터 로드 실패",
                description: "CCTV 데이터를 불러오는데 실패했습니다.",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchDistricts = async () => {
        try {
            const response = await apiService.getAllDistricts()
            setDistricts(response.districts || [])
        } catch (error) {
            console.error('Error fetching districts:', error)
        }
    }

    const handleExportCSV = async () => {
        try {
            const blob = await apiService.exportCCTVData()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'cctv_data.csv'
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast({
                title: "내보내기 완료",
                description: "CCTV 데이터가 CSV 파일로 내보내졌습니다.",
            })
        } catch (error) {
            console.error('Error exporting CSV:', error)
            toast({
                title: "내보내기 실패",
                description: "CSV 내보내기에 실패했습니다.",
                variant: "destructive",
            })
        }
    }

    const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)

        try {
            await apiService.importCCTVFromCSV(formData)
            toast({
                title: "가져오기 완료",
                description: "CSV 파일에서 CCTV 데이터를 성공적으로 가져왔습니다.",
            })
            fetchCCTVs() // Refresh the list
        } catch (error) {
            console.error('Error importing CSV:', error)
            toast({
                title: "가져오기 실패",
                description: "CSV 가져오기에 실패했습니다.",
                variant: "destructive",
            })
        }
    }

    const handleDeleteCCTV = async (id: string) => {
        if (!confirm('이 CCTV를 삭제하시겠습니까?')) return

        try {
            await apiService.deleteCCTVById(id)
            setCctvs(cctvs.filter(cctv => cctv.id !== id))
            toast({
                title: "삭제 완료",
                description: "CCTV가 성공적으로 삭제되었습니다.",
            })
        } catch (error) {
            console.error('Error deleting CCTV:', error)
            toast({
                title: "삭제 실패",
                description: "CCTV 삭제에 실패했습니다.",
                variant: "destructive",
            })
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-8">
                <div className="text-center">로딩 중...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen w-full bg-gray-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">CCTV 관리</h1>
                    <div className="flex gap-4">
                        <Button onClick={() => router.push('/')} variant="outline">
                            홈으로
                        </Button>
                        <Button onClick={handleExportCSV} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            CSV 내보내기
                        </Button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleImportCSV}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="outline">
                                <Upload className="mr-2 h-4 w-4" />
                                CSV 가져오기
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>통계</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{cctvs.length}</div>
                                    <div className="text-sm text-gray-500">총 CCTV 수</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {cctvs.filter(cctv => cctv.status).length}
                                    </div>
                                    <div className="text-sm text-gray-500">정상 작동</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold">{districts.length}</div>
                                    <div className="text-sm text-gray-500">관리 지역</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>CCTV 목록</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">이름</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">주소</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">도시</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">구/군</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">상태</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cctvs.map((cctv) => (
                                        <tr key={cctv.id} className="hover:bg-gray-50">
                                            <td className="border border-gray-300 px-4 py-2">{cctv.id}</td>
                                            <td className="border border-gray-300 px-4 py-2">{cctv.name}</td>
                                            <td className="border border-gray-300 px-4 py-2">{cctv.address}</td>
                                            <td className="border border-gray-300 px-4 py-2">{cctv.city}</td>
                                            <td className="border border-gray-300 px-4 py-2">{cctv.district}</td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <span className={`px-2 py-1 rounded-full text-xs ${cctv.status
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {cctv.status ? '정상' : '오류'}
                                                </span>
                                            </td>
                                            <td className="border border-gray-300 px-4 py-2">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDeleteCCTV(cctv.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}