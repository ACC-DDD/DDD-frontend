"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiService } from "../services/api"
import { authManager } from "../utils/auth"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [districts, setDistricts] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phoneNum: "",
    password: "",
    confirmPassword: "",
    city: "",
    district: "",
  })

  // Predefined cities (you can also fetch these from API if needed)
  const cities = ["서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시", "대전광역시", "울산광역시", "세종특별자치시"]

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.city) {
        setDistricts([])
        return
      }
      
      try {
        const response = await apiService.getAllDistricts()
        // Filter districts by selected city if the API returns city-district mapping
        setDistricts(response.districts || [])
      } catch (error) {
        console.error('Error fetching districts:', error)
        // Fallback districts for Seoul
        if (formData.city === "서울특별시") {
          setDistricts(["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"])
        }
      }
    }

    fetchDistricts()
  }, [formData.city])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiService.signup({
        name: formData.name,
        phoneNum: formData.phoneNum,
        password: formData.password,
        city: formData.city,
        district: formData.district,
      })
      
      // Store tokens and user data if provided
      if (response.accessToken && response.refreshToken) {
        authManager.setTokens({
          accessToken: response.accessToken,
          refreshToken: response.refreshToken
        })
      }
      
      authManager.setUserData(response.user)
      
      toast({
        title: "회원가입 완료",
        description: "환영합니다!",
      })
      
      router.push("/")
    } catch (error) {
      console.error("Error signing up:", error)
      toast({
        title: "회원가입 실패",
        description: error instanceof Error ? error.message : "다시 시도해주세요",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCityChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      city: value,
      district: "" // Reset district when city changes
    }))
  }

  const handleDistrictChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      district: value
    }))
  }



  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">이름</Label>
              <Input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNum" className="text-base">전화번호</Label>
              <Input
                id="phoneNum"
                type="tel"
                required
                value={formData.phoneNum}
                onChange={(e) => setFormData({ ...formData, phoneNum: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-base">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-base">도시</Label>
              <Select onValueChange={handleCityChange} value={formData.city}>
                <SelectTrigger>
                  <SelectValue placeholder="도시를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="district" className="text-base">구/군</Label>
              <Select 
                onValueChange={handleDistrictChange} 
                value={formData.district}
                disabled={!formData.city}
              >
                <SelectTrigger>
                  <SelectValue placeholder="구/군을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district} value={district}>
                      {district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "회원가입 중..." : "회원가입"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
