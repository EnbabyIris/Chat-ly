# Chat-Turbo API Test Script
# Tests all API endpoints using PowerShell Invoke-RestMethod
# Make sure the API server is running on http://localhost:5000

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:5000"
$apiUrl = "$baseUrl/api/v1"

# Colors for output
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Warning { param($msg) Write-Host "⚠️  $msg" -ForegroundColor Yellow }

# Test results tracking
$testResults = @{
    Total = 0
    Passed = 0
    Failed = 0
    Skipped = 0
}

# Helper function to make API calls
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$Description
    )
    
    $testResults.Total++
    $url = "$apiUrl$Endpoint"
    
    try {
        Write-Info "Testing: $Description"
        Write-Host "  $Method $url" -ForegroundColor Gray
        
        $params = @{
            Method = $Method
            Uri = $url
            Headers = $Headers
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        
        Write-Success "$Description - Status: OK"
        if ($response) {
            Write-Host "  Response: $($response | ConvertTo-Json -Depth 3 -Compress)" -ForegroundColor DarkGray
        }
        $testResults.Passed++
        return $response
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        if ($statusCode -eq 404 -or $statusCode -eq 401) {
            Write-Warning "$Description - Status: $statusCode ($errorMessage)"
            $testResults.Skipped++
            return $null
        }
        else {
            Write-Error "$Description - Status: $statusCode - $errorMessage"
            $testResults.Failed++
            return $null
        }
    }
}

# Test variables (will be populated during tests)
$accessToken = $null
$refreshToken = $null
$userId = $null
$chatId = $null
$messageId = $null
$testUserEmail = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$testUserPassword = "TestPassword123!"
$testUserName = "Test User"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Chat-Turbo API Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. HEALTH CHECK
# ============================================
Write-Host "`n[1] Testing Health Check Endpoints" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

$health = Invoke-ApiRequest -Method "GET" -Endpoint "/health" -Description "Health Check"
$root = Invoke-ApiRequest -Method "GET" -Endpoint "" -Description "Root Endpoint"
$apiDocs = Invoke-ApiRequest -Method "GET" -Endpoint "" -Description "API Documentation"

# ============================================
# 2. AUTHENTICATION ENDPOINTS
# ============================================
Write-Host "`n[2] Testing Authentication Endpoints" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

# 2.1 Register User
Write-Host "`n--- Register New User ---" -ForegroundColor Magenta
$registerBody = @{
    name = $testUserName
    email = $testUserEmail
    password = $testUserPassword
}
$registerResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/register" -Body $registerBody -Description "Register User"

if ($registerResponse -and $registerResponse.data) {
    $accessToken = $registerResponse.data.accessToken
    $refreshToken = $registerResponse.data.refreshToken
    $userId = $registerResponse.data.user.id
    Write-Success "User registered successfully! User ID: $userId"
}

# If registration failed, try login (user might already exist)
if (-not $accessToken) {
    Write-Info "Registration failed, trying login with existing user..."
    $loginBody = @{
        email = $testUserEmail
        password = $testUserPassword
    }
    $loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body $loginBody -Description "Login User"
    
    if ($loginResponse -and $loginResponse.data) {
        $accessToken = $loginResponse.data.accessToken
        $refreshToken = $loginResponse.data.refreshToken
        $userId = $loginResponse.data.user.id
        Write-Success "User logged in successfully! User ID: $userId"
    }
}

# 2.2 Login (if we have tokens, test with different credentials)
Write-Host "`n--- Login User ---" -ForegroundColor Magenta
$loginBody = @{
    email = $testUserEmail
    password = $testUserPassword
}
$loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/login" -Body $loginBody -Description "Login User"

if ($loginResponse -and $loginResponse.data -and -not $accessToken) {
    $accessToken = $loginResponse.data.accessToken
    $refreshToken = $loginResponse.data.refreshToken
    $userId = $loginResponse.data.user.id
}

# 2.3 Get Current User (requires auth)
Write-Host "`n--- Get Current User ---" -ForegroundColor Magenta
if ($accessToken) {
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    $meResponse = Invoke-ApiRequest -Method "GET" -Endpoint "/auth/me" -Headers $authHeaders -Description "Get Current User"
}

# 2.4 Refresh Token
Write-Host "`n--- Refresh Token ---" -ForegroundColor Magenta
if ($refreshToken) {
    $refreshBody = @{
        refreshToken = $refreshToken
    }
    $refreshResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/refresh" -Body $refreshBody -Description "Refresh Token"
    
    if ($refreshResponse -and $refreshResponse.data) {
        $accessToken = $refreshResponse.data.accessToken
        $refreshToken = $refreshResponse.data.refreshToken
        Write-Success "Token refreshed successfully!"
    }
}

# ============================================
# 3. USER ENDPOINTS
# ============================================
Write-Host "`n[3] Testing User Endpoints" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

if (-not $accessToken) {
    Write-Warning "Skipping user endpoints - no access token"
}
else {
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    # 3.1 Get All Users
    Write-Host "`n--- Get All Users ---" -ForegroundColor Magenta
    $allUsers = Invoke-ApiRequest -Method "GET" -Endpoint "/users" -Headers $authHeaders -Description "Get All Users"
    
    # 3.2 Search Users
    Write-Host "`n--- Search Users ---" -ForegroundColor Magenta
    $searchUsers = Invoke-ApiRequest -Method "GET" -Endpoint "/users/search?query=test" -Headers $authHeaders -Description "Search Users"
    
    # 3.3 Get User By ID
    Write-Host "`n--- Get User By ID ---" -ForegroundColor Magenta
    if ($userId) {
        $userById = Invoke-ApiRequest -Method "GET" -Endpoint "/users/$userId" -Headers $authHeaders -Description "Get User By ID"
    }
    
    # 3.4 Update Profile
    Write-Host "`n--- Update User Profile ---" -ForegroundColor Magenta
    $updateBody = @{
        name = "Updated Test User"
        bio = "This is a test bio"
    }
    $updateProfile = Invoke-ApiRequest -Method "PUT" -Endpoint "/users/profile" -Body $updateBody -Headers $authHeaders -Description "Update User Profile"
}

# ============================================
# 4. CHAT ENDPOINTS
# ============================================
Write-Host "`n[4] Testing Chat Endpoints" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

if (-not $accessToken) {
    Write-Warning "Skipping chat endpoints - no access token"
}
else {
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    # 4.1 Get User Chats
    Write-Host "`n--- Get User Chats ---" -ForegroundColor Magenta
    $userChats = Invoke-ApiRequest -Method "GET" -Endpoint "/chats" -Headers $authHeaders -Description "Get User Chats"
    
    # 4.2 Create Chat (1:1 chat - need another user ID)
    Write-Host "`n--- Create Chat ---" -ForegroundColor Magenta
    if ($allUsers -and $allUsers.data -and $allUsers.data.Count -gt 0) {
        $otherUserId = $allUsers.data[0].id
        if ($otherUserId -ne $userId) {
            $createChatBody = @{
                participantIds = @($otherUserId)
                isGroupChat = $false
            }
            $createChat = Invoke-ApiRequest -Method "POST" -Endpoint "/chats" -Body $createChatBody -Headers $authHeaders -Description "Create 1:1 Chat"
            
            if ($createChat -and $createChat.data) {
                $chatId = $createChat.data.id
                Write-Success "Chat created! Chat ID: $chatId"
            }
        }
    }
    
    # 4.3 Create Group Chat
    Write-Host "`n--- Create Group Chat ---" -ForegroundColor Magenta
    if ($allUsers -and $allUsers.data -and $allUsers.data.Count -gt 1) {
        $participantIds = $allUsers.data | Select-Object -First 2 | ForEach-Object { $_.id }
        $createGroupBody = @{
            name = "Test Group Chat"
            participantIds = $participantIds
            isGroupChat = $true
            description = "This is a test group chat"
        }
        $createGroup = Invoke-ApiRequest -Method "POST" -Endpoint "/chats" -Body $createGroupBody -Headers $authHeaders -Description "Create Group Chat"
        
        if ($createGroup -and $createGroup.data -and -not $chatId) {
            $chatId = $createGroup.data.id
            Write-Success "Group chat created! Chat ID: $chatId"
        }
    }
    
    # 4.4 Get Chat By ID
    Write-Host "`n--- Get Chat By ID ---" -ForegroundColor Magenta
    if ($chatId) {
        $chatById = Invoke-ApiRequest -Method "GET" -Endpoint "/chats/$chatId" -Headers $authHeaders -Description "Get Chat By ID"
    }
    
    # 4.5 Update Chat
    Write-Host "`n--- Update Chat ---" -ForegroundColor Magenta
    if ($chatId) {
        $updateChatBody = @{
            name = "Updated Group Chat Name"
            description = "Updated description"
        }
        $updateChat = Invoke-ApiRequest -Method "PUT" -Endpoint "/chats/$chatId" -Body $updateChatBody -Headers $authHeaders -Description "Update Chat"
    }
    
    # 4.6 Get Chat Messages
    Write-Host "`n--- Get Chat Messages ---" -ForegroundColor Magenta
    if ($chatId) {
        $chatMessages = Invoke-ApiRequest -Method "GET" -Endpoint "/chats/$chatId/messages" -Headers $authHeaders -Description "Get Chat Messages"
    }
}

# ============================================
# 5. MESSAGE ENDPOINTS
# ============================================
Write-Host "`n[5] Testing Message Endpoints" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

if (-not $accessToken -or -not $chatId) {
    Write-Warning "Skipping message endpoints - no access token or chat ID"
}
else {
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    # 5.1 Send Message
    Write-Host "`n--- Send Message ---" -ForegroundColor Magenta
    $sendMessageBody = @{
        chatId = $chatId
        content = "Hello! This is a test message from PowerShell API test script."
        messageType = "text"
    }
    $sendMessage = Invoke-ApiRequest -Method "POST" -Endpoint "/messages" -Body $sendMessageBody -Headers $authHeaders -Description "Send Message"
    
    if ($sendMessage -and $sendMessage.data) {
        $messageId = $sendMessage.data.id
        Write-Success "Message sent! Message ID: $messageId"
    }
    
    # 5.2 Update Message
    Write-Host "`n--- Update Message ---" -ForegroundColor Magenta
    if ($messageId) {
        $updateMessageBody = @{
            content = "This message has been updated!"
        }
        $updateMessage = Invoke-ApiRequest -Method "PUT" -Endpoint "/messages/$messageId" -Body $updateMessageBody -Headers $authHeaders -Description "Update Message"
    }
    
    # 5.3 Mark Message as Read
    Write-Host "`n--- Mark Message as Read ---" -ForegroundColor Magenta
    if ($messageId) {
        $markRead = Invoke-ApiRequest -Method "POST" -Endpoint "/messages/$messageId/read" -Headers $authHeaders -Description "Mark Message as Read"
    }
    
    # 5.4 Send Another Message
    Write-Host "`n--- Send Another Message ---" -ForegroundColor Magenta
    $sendMessageBody2 = @{
        chatId = $chatId
        content = "This is a second test message."
        messageType = "text"
    }
    $sendMessage2 = Invoke-ApiRequest -Method "POST" -Endpoint "/messages" -Body $sendMessageBody2 -Headers $authHeaders -Description "Send Second Message"
    
    # 5.5 Delete Message (soft delete)
    Write-Host "`n--- Delete Message ---" -ForegroundColor Magenta
    if ($messageId) {
        $deleteMessage = Invoke-ApiRequest -Method "DELETE" -Endpoint "/messages/$messageId" -Headers $authHeaders -Description "Delete Message"
    }
}

# ============================================
# 6. LOGOUT
# ============================================
Write-Host "`n[6] Testing Logout" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow

if ($accessToken) {
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    $logout = Invoke-ApiRequest -Method "POST" -Endpoint "/auth/logout" -Headers $authHeaders -Description "Logout User"
}

# ============================================
# TEST SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests:  $($testResults.Total)" -ForegroundColor White
Write-Success "Passed: $($testResults.Passed)"
Write-Error "Failed: $($testResults.Failed)"
Write-Warning "Skipped: $($testResults.Skipped)"
Write-Host "`n========================================`n" -ForegroundColor Cyan

if ($testResults.Failed -eq 0) {
    Write-Success "All tests completed successfully! 🎉"
    exit 0
}
else {
    Write-Error "Some tests failed. Please check the output above."
    exit 1
}
