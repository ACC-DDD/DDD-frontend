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

  // Predefined cities and districts mapping
  const cityDistrictMap: { [key: string]: string[] } = {
    "서울특별시": ["금천구", "강서구", "양천구", "송파구", "강동구", "서초구", "중랑구", "노원구", "강남구", "강북구", "관악구", "광진구", "구로구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "성동구", "성북구", "영등포구", "용산구", "은평구", "종로구", "중구"],
    "부산광역시": ["사상구", "강서구", "북구", "금정구", "기장군", "해운대구", "동구", "서구", "남구", "중구", "영도구", "부산진구", "동래구", "연제구", "수영구", "사하구"],
    "대구광역시": ["동구", "서구", "달성군", "달서구", "북구", "수성구", "군위군", "중구"],
    "인천광역시": ["남동구", "미추홀구", "부평구", "계양구", "중구", "서구", "연수구", "동구", "옹진군", "강화군"],
    "광주광역시": ["광산구", "북구", "서구", "남구", "동구"],
    "대전광역시": ["대덕구", "서구", "동구", "유성구", "중구"],
    "울산광역시": ["울주군", "중구", "남구", "동구", "북구"],
    "세종특별자치시": ["세종시"],
    "경기도": ["평택시", "의왕시", "군포시", "시흥시", "광명시", "안양시 만안구", "안산시 단원구", "안산시 상록구", "수원시 장안구", "부천시 오정구", "김포시", "고양시 덕양구", "화성시", "부천시 원미구", "오산시", "안양시 동안구", "양주시", "수원시 권선구", "고양시 일산동구", "파주시", "안성시", "성남시 수정구", "성남시 중원구", "하남시", "구리시", "남양주시", "성남시 분당구", "이천시", "광주시", "수원시 영통구", "용인시 기흥구", "용인시 수지구", "용인시 처인구", "여주시", "가평군", "양평군", "포천시", "의정부시", "고양시 일산서구", "부천시 소사구"],
    "강원특별자치도": ["원주시", "홍천군", "춘천시", "횡성군", "강릉시", "평창군", "양양군", "인제군", "영월군", "동해시", "삼척시", "속초시", "태백시", "정선군", "철원군", "화천군", "양구군", "고성군"],
    "충청북도": ["청주시 흥덕구", "옥천군", "청주시 서원구", "괴산군", "진천군", "보은군", "영동군", "충주시", "청주시 상당구", "청주시 청원구", "음성군", "단양군", "제천시", "증평군"],
    "충청남도": ["예산군", "공주시", "서천군", "부여군", "청양군", "보령시", "홍성군", "당진시", "서산시", "아산시", "천안시 서북구", "천안시 동남구", "논산시", "금산군", "계룡시", "태안군"],
    "전북특별자치도": ["고창군", "김제시", "정읍시", "군산시", "부안군", "임실군", "완주군", "익산시", "진안군", "남원시", "순창군", "장수군", "무주군", "전주시 덕진구", "전주시 완산구"],
    "전라남도": ["무안군", "장흥군", "강진군", "영암군", "함평군", "영광군", "담양군", "장성군", "나주시", "순천시", "광양시", "보성군", "고흥군", "곡성군", "구례군", "목포시", "여수시", "완도군", "진도군", "신안군", "해남군", "화순군"],
    "경상북도": ["상주시", "영천시", "경산시", "고령군", "성주군", "칠곡군", "청도군", "구미시", "김천시", "의성군", "안동시", "문경시", "예천군", "영주시", "청송군", "경주시", "포항시 남구", "영덕군", "포항시 북구", "봉화군", "울진군", "울릉군", "군위군"],
    "경상남도": ["하동군", "산청군", "함양군", "거창군", "사천시", "진주시", "통영시", "고성군", "합천군", "함안군", "김해시", "창원시 마산회원구", "밀양시", "창녕군", "창원시 의창구", "창원시 진해구", "양산시", "창원시 마산합포구", "창원시 성산구", "거제시", "남해군"]
  }

  const cities = Object.keys(cityDistrictMap)

  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.city) {
        setDistricts([])
        return
      }

      console.log(`🔄 Attempting to fetch districts for ${formData.city} from backend...`)
      try {
        const response = await apiService.getAllDistricts()
        console.log('✅ Successfully fetched districts from backend:', response)
        // Filter districts by selected city if the API returns city-district mapping
        setDistricts(response.districts || [])
      } catch (error) {
        console.error('❌ Error fetching districts from backend:', error)
        console.log(`🔄 Using predefined districts for ${formData.city}...`)
        // Fallback to predefined districts for the selected city
        setDistricts(cityDistrictMap[formData.city] || [])
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
