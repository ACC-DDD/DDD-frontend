"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LogOut, User, MapPin, Phone, Edit2, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiService } from "../services/api"
import { authManager } from "../utils/auth"

interface UserData {
  username: string
  phoneNumber: string
  location: string
}

interface LocationOption {
  value: string
  label: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<UserData | null>(null)
  const [open, setOpen] = useState(false)
  const [phoneError, setPhoneError] = useState("")
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await apiService.getAllDistricts()
        setLocations(response.districts.map((district: string) => ({
          value: district,
          label: district
        })))
      } catch (error) {
        console.error('Error fetching locations:', error)
        // Fallback to basic locations
        setLocations([
          { value: "강남구", label: "강남구" },
          { value: "송파구", label: "송파구" },
          { value: "서초구", label: "서초구" },
          { value: "마포구", label: "마포구" },
          { value: "용산구", label: "용산구" },
          { value: "중구", label: "중구" },
          { value: "종로구", label: "종로구" },
          { value: "성동구", label: "성동구" },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchLocations()
  }, [])

  useEffect(() => {
    const fetchUserData = async () => {
      if (!authManager.isAuthenticated()) {
        router.push('/login')
        return
      }

      try {
        const response = await apiService.getMyProfile()
        const userData = {
          username: response.name,
          phoneNumber: response.phoneNum,
          location: response.district || response.city || ''
        }
        setUserData(userData)
        setEditedData(userData)
      } catch (error) {
        console.error('Error fetching user data:', error)
        // Fallback to stored data
        const storedData = authManager.getUserData()
        if (storedData) {
          const userData = {
            username: storedData.name,
            phoneNumber: storedData.phoneNum,
            location: storedData.district || storedData.city || ''
          }
          setUserData(userData)
          setEditedData(userData)
        } else {
          router.push('/login')
        }
      }
    }

    fetchUserData()
  }, [router])

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^010-\d{4}-\d{4}$/
    return phoneRegex.test(phone)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    let formatted = value.replace(/[^0-9]/g, '')
    if (formatted.length > 0) {
      if (formatted.length <= 3) {
        formatted = formatted
      } else if (formatted.length <= 7) {
        formatted = `${formatted.slice(0, 3)}-${formatted.slice(3)}`
      } else {
        formatted = `${formatted.slice(0, 3)}-${formatted.slice(3, 7)}-${formatted.slice(7, 11)}`
      }
    }
    setEditedData(prev => prev ? { ...prev, phoneNumber: formatted } : null)
    
    if (formatted.length > 0 && !validatePhoneNumber(formatted)) {
      setPhoneError("010-XXXX-XXXX 형식으로 입력해주세요")
    } else {
      setPhoneError("")
    }
  }

  const handleSave = async () => {
    if (!editedData) return

    if (!validatePhoneNumber(editedData.phoneNumber)) {
      toast({
        title: "전화번호 형식 오류",
        description: "010-XXXX-XXXX 형식으로 입력해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      await apiService.updateMyProfile({
        name: editedData.username,
        phoneNum: editedData.phoneNumber,
        district: editedData.location
      })

      // Update stored user data
      const currentUserData = authManager.getUserData()
      if (currentUserData) {
        authManager.setUserData({
          ...currentUserData,
          name: editedData.username,
          phoneNum: editedData.phoneNumber,
          district: editedData.location
        })
      }

      setUserData(editedData)
      setIsEditing(false)
      toast({
        title: "프로필 수정 완료",
        description: "프로필이 성공적으로 수정되었습니다.",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "프로필 수정 실패",
        description: error instanceof Error ? error.message : "프로필 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    try {
      await authManager.logout()
      toast({
        title: "로그아웃 완료",
        description: "로그아웃되었습니다.",
      })
      router.push('/')
    } catch (error) {
      console.error('Error during logout:', error)
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      })
    }
  }

  if (!userData || !editedData || loading) {
    return (
      <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-8">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">프로필</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">이름</p>
                {isEditing ? (
                  <Input
                    value={editedData.username}
                    onChange={(e) => setEditedData({ ...editedData, username: e.target.value })}
                  />
                ) : (
                  <p className="font-medium">{userData.username}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">전화번호</p>
                {isEditing ? (
                  <div>
                    <Input
                      value={editedData.phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder="010-0000-0000"
                    />
                    {phoneError && <p className="text-sm text-red-500 mt-1">{phoneError}</p>}
                  </div>
                ) : (
                  <p className="font-medium">{userData.phoneNumber}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">위치</p>
                {isEditing ? (
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        {editedData.location || "위치를 선택하세요"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="위치 검색..." />
                        <CommandEmpty>위치를 찾을 수 없습니다.</CommandEmpty>
                        <CommandGroup>
                          {locations.map((location) => (
                            <CommandItem
                              key={location.value}
                              value={location.value}
                              onSelect={(currentValue) => {
                                setEditedData({ ...editedData, location: currentValue })
                                setOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  editedData.location === location.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {location.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="font-medium">{userData.location}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            {isEditing ? (
              <>
                <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>
                  취소
                </Button>
                <Button className="w-full" onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  저장
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                  홈으로
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  수정
                </Button>
              </>
            )}
          </div>
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 