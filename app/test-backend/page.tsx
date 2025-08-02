"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { apiService } from "../services/api"
import { CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface TestResult {
    name: string
    status: 'pending' | 'success' | 'error'
    message: string
    data?: any
}

export default function TestBackendPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [testResults, setTestResults] = useState<TestResult[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [testCredentials, setTestCredentials] = useState({
        phoneNum: "010-1234-5678",
        password: "testpassword"
    })

    const updateTestResult = (name: string, status: 'success' | 'error', message: string, data?: any) => {
        setTestResults(prev => prev.map(test =>
            test.name === name ? { ...test, status, message, data } : test
        ))
    }

    const runAllTests = async () => {
        setIsRunning(true)

        // Initialize test results
        const initialTests: TestResult[] = [
            { name: "CCTV 데이터 조회", status: 'pending', message: "테스트 중..." },
            { name: "지역 정보 조회", status: 'pending', message: "테스트 중..." },
            { name: "회원가입 테스트", status: 'pending', message: "테스트 중..." },
            { name: "로그인 테스트", status: 'pending', message: "테스트 중..." },
        ]
        setTestResults(initialTests)

        // Test 1: CCTV Data
        try {
            console.log('🧪 Testing CCTV data fetch...')
            const cctvData = await apiService.getAllCCTVs()
            updateTestResult("CCTV 데이터 조회", 'success', `${cctvData.length}개의 CCTV 데이터를 성공적으로 가져왔습니다.`, cctvData)
        } catch (error) {
            updateTestResult("CCTV 데이터 조회", 'error', `실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }

        // Test 2: Districts Data
        try {
            console.log('🧪 Testing districts data fetch...')
            const districtsData = await apiService.getAllDistricts()
            updateTestResult("지역 정보 조회", 'success', `${districtsData.districts?.length || 0}개의 지역 정보를 성공적으로 가져왔습니다.`, districtsData)
        } catch (error) {
            updateTestResult("지역 정보 조회", 'error', `실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }

        // Test 3: Signup
        try {
            console.log('🧪 Testing signup...')
            const signupData = await apiService.signup({
                name: "테스트 사용자",
                phoneNum: testCredentials.phoneNum,
                password: testCredentials.password,
                city: "서울특별시",
                district: "강남구"
            })
            updateTestResult("회원가입 테스트", 'success', "회원가입이 성공적으로 완료되었습니다.", signupData)
        } catch (error) {
            updateTestResult("회원가입 테스트", 'error', `실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }

        // Test 4: Login
        try {
            console.log('🧪 Testing login...')
            const loginData = await apiService.login(testCredentials.phoneNum, testCredentials.password)
            updateTestResult("로그인 테스트", 'success', "로그인이 성공적으로 완료되었습니다.", loginData)
        } catch (error) {
            updateTestResult("로그인 테스트", 'error', `실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        }

        setIsRunning(false)
        toast({
            title: "백엔드 테스트 완료",
            description: "모든 테스트가 완료되었습니다. 결과를 확인해주세요.",
        })
    }

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'error':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />
        }
    }

    const getStatusColor = (status: TestResult['status']) => {
        switch (status) {
            case 'success':
                return 'border-green-200 bg-green-50'
            case 'error':
                return 'border-red-200 bg-red-50'
            case 'pending':
                return 'border-yellow-200 bg-yellow-50'
        }
    }

    return (
        <div className="min-h-screen w-full bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        홈으로 돌아가기
                    </Button>
                    <h1 className="text-3xl font-bold">백엔드 연결 테스트</h1>
                </div>

                <div className="grid gap-6">
                    {/* Backend URL Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>백엔드 설정 정보</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p><strong>API Base URL:</strong> {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'}</p>
                                <p className="text-sm text-gray-600">
                                    백엔드가 다른 주소에서 실행 중이라면 .env.local 파일에서 NEXT_PUBLIC_API_BASE_URL을 수정하세요.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test Credentials */}
                    <Card>
                        <CardHeader>
                            <CardTitle>테스트 계정 정보</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="phoneNum">전화번호</Label>
                                    <Input
                                        id="phoneNum"
                                        value={testCredentials.phoneNum}
                                        onChange={(e) => setTestCredentials(prev => ({ ...prev, phoneNum: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="password">비밀번호</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={testCredentials.password}
                                        onChange={(e) => setTestCredentials(prev => ({ ...prev, password: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Test Controls */}
                    <Card>
                        <CardHeader>
                            <CardTitle>테스트 실행</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={runAllTests}
                                disabled={isRunning}
                                className="w-full"
                            >
                                {isRunning ? "테스트 실행 중..." : "모든 백엔드 API 테스트 실행"}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Test Results */}
                    {testResults.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>테스트 결과</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {testResults.map((test, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-lg border-2 ${getStatusColor(test.status)}`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusIcon(test.status)}
                                                <h3 className="font-semibold">{test.name}</h3>
                                            </div>
                                            <p className="text-sm text-gray-700 mb-2">{test.message}</p>
                                            {test.data && (
                                                <details className="text-xs">
                                                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                                        응답 데이터 보기
                                                    </summary>
                                                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
                                                        {JSON.stringify(test.data, null, 2)}
                                                    </pre>
                                                </details>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Instructions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>사용 방법</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm">
                                <p><strong>1.</strong> 백엔드 서버가 실행 중인지 확인하세요.</p>
                                <p><strong>2.</strong> 위의 "모든 백엔드 API 테스트 실행" 버튼을 클릭하세요.</p>
                                <p><strong>3.</strong> 각 테스트 결과를 확인하세요:</p>
                                <ul className="ml-4 space-y-1">
                                    <li>• <span className="text-green-600">녹색</span>: 성공 (백엔드 연결됨)</li>
                                    <li>• <span className="text-red-600">빨간색</span>: 실패 (백엔드 연결 안됨)</li>
                                    <li>• <span className="text-yellow-600">노란색</span>: 테스트 중</li>
                                </ul>
                                <p><strong>4.</strong> 브라우저 개발자 도구의 Console과 Network 탭도 확인해보세요.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}