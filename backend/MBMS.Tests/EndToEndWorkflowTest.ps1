# =======================================================================
# MBMS Industrial Maintenance System - End-to-End Acceptance Test
# =======================================================================

$baseUrl = "http://localhost:5102/api"
$ErrorActionPreference = "Stop"

function Login($user, $pass) {
    $body = @{ username = $user; password = $pass } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -ContentType "application/json" -Body $body
    return $res
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Starting MBMS Industrial End-to-End Acceptance Test Suite" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Supervisor Login & Ticket Creation
Write-Host "`n[Step 1] Logging in as Production Supervisor (supervisor1)..." -ForegroundColor Yellow
$supAuth = Login "supervisor1" "Supervisor@123"
Write-Host "Logged in as: $($supAuth.employeeName) ($($supAuth.roles -join ','))" -ForegroundColor Green

Write-Host "`n[Step 2] Reporting breakdown on machine MCH-CNC-002..." -ForegroundColor Yellow
$createReq = @{
    machineId = 2; # MCH-CNC-002
    categoryId = 1; # Electrical
    breakdownOccurredAt = (Get-Date).AddMinutes(-45).ToString("o");
    breakdownReason = "Spindle coolant pump motor trip";
    breakdownDescription = "Overload relay tripped repeatedly on start of CNC lathe cycle.";
    machineCondition = "STOPPED";
    productionImpact = "HIGH";
    priority = "HIGH"
} | ConvertTo-Json

$supHeaders = @{ Authorization = "Bearer $($supAuth.token)" }
$ticket = Invoke-RestMethod -Uri "$baseUrl/tickets" -Method Post -ContentType "application/json" -Body $createReq -Headers $supHeaders
Write-Host "Ticket Created Successfully! Ticket ID: $($ticket.ticketId), Ticket Number: $($ticket.ticketNumber), Status: $($ticket.currentStatus)" -ForegroundColor Green

if ($ticket.currentStatus -ne "NEW") { throw "Status expected NEW, got $($ticket.currentStatus)" }
$ticketId = $ticket.ticketId

# 2. Maintenance Incharge Login & Assignment
Write-Host "`n[Step 3] Logging in as Maintenance Incharge (incharge1)..." -ForegroundColor Yellow
$incAuth = Login "incharge1" "Incharge@123"
Write-Host "Logged in as: $($incAuth.employeeName)" -ForegroundColor Green

Write-Host "`n[Step 4] Assigning Mechanic (Alex Brown - MechId 1) to $ticketId..." -ForegroundColor Yellow
$assignReq = @{
    mechanicId = 1;
    remarks = "Inspect pump contactor and motor insulation"
} | ConvertTo-Json

$incHeaders = @{ Authorization = "Bearer $($incAuth.token)" }
$assignedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/assign" -Method Post -ContentType "application/json" -Body $assignReq -Headers $incHeaders
Write-Host "Assignment Successful! Status: $($assignedTicket.currentStatus), Mechanic: $($assignedTicket.currentAssignment.employeeName)" -ForegroundColor Green

if ($assignedTicket.currentStatus -ne "ASSIGNED") { throw "Status expected ASSIGNED" }

# 3. Mechanic Login, Accept, Start, Pause, Resume, Complete
Write-Host "`n[Step 5] Logging in as Mechanic (mech1)..." -ForegroundColor Yellow
$mechAuth = Login "mech1" "Mechanic@123"
$mechHeaders = @{ Authorization = "Bearer $($mechAuth.token)" }
Write-Host "Logged in as: $($mechAuth.employeeName) (MechanicId: $($mechAuth.mechanicId))" -ForegroundColor Green

Write-Host "`n[Step 6] Mechanic accepting job..." -ForegroundColor Yellow
$acceptedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/accept" -Method Post -Headers $mechHeaders
Write-Host "Accepted! Status: $($acceptedTicket.currentStatus)" -ForegroundColor Green
if ($acceptedTicket.currentStatus -ne "ACCEPTED") { throw "Status expected ACCEPTED" }

Write-Host "`n[Step 7] Mechanic starting work..." -ForegroundColor Yellow
$startReq = @{ remarks = "Commenced electrical insulation resistance testing." } | ConvertTo-Json
$startedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/start-work" -Method Post -ContentType "application/json" -Body $startReq -Headers $mechHeaders
Write-Host "Work Started! Status: $($startedTicket.currentStatus)" -ForegroundColor Green
if ($startedTicket.currentStatus -ne "IN_PROGRESS") { throw "Status expected IN_PROGRESS" }

Write-Host "`n[Step 8] Mechanic putting work on hold (Awaiting spare fuse)..." -ForegroundColor Yellow
$pauseReq = @{ reason = "Awaiting Spare Parts"; notes = "Replacing 32A DIN fuse" } | ConvertTo-Json
$pausedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/pause-work" -Method Post -ContentType "application/json" -Body $pauseReq -Headers $mechHeaders
Write-Host "Work Paused! Status: $($pausedTicket.currentStatus)" -ForegroundColor Green
if ($pausedTicket.currentStatus -ne "ON_HOLD") { throw "Status expected ON_HOLD" }

Write-Host "`n[Step 9] Mechanic resuming work..." -ForegroundColor Yellow
$resumeReq = @{ notes = "New fuse procured from store, resuming installation." } | ConvertTo-Json
$resumedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/resume-work" -Method Post -ContentType "application/json" -Body $resumeReq -Headers $mechHeaders
Write-Host "Work Resumed! Status: $($resumedTicket.currentStatus)" -ForegroundColor Green
if ($resumedTicket.currentStatus -ne "IN_PROGRESS") { throw "Status expected IN_PROGRESS" }

Write-Host "`n[Step 10] Mechanic completing work and submitting for verification..." -ForegroundColor Yellow
$completeReq = @{
    inspectionFindings = "Coolant pump motor terminal box showed loose lug connection causing arcing.";
    actualRootCause = "Vibration caused terminal screw loosening leading to single-phasing trip.";
    actionTaken = "Re-crimped cable lugs, tightened terminal block, replaced blown fuse, verified 415V balance and 4.2A current under load.";
    machineConditionAfterRepair = "RUNNING_NORMAL";
    mechanicRemarks = "Tested coolant pump continuously for 15 minutes. Coolant flow verified normal.";
    partsUsed = @(
        @{ partId = 5; quantity = 1; remarks = "Replaced 32A HRC Fuse Link" }
    )
} | ConvertTo-Json

$completedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/complete-work" -Method Post -ContentType "application/json" -Body $completeReq -Headers $mechHeaders
Write-Host "Submitted! Status: $($completedTicket.currentStatus) (Awaiting Supervisor)" -ForegroundColor Green
if ($completedTicket.currentStatus -ne "AWAITING_SUPERVISOR") { throw "Status expected AWAITING_SUPERVISOR" }

# 4. Supervisor Verification & Digital Signature (Stage 1)
Write-Host "`n[Step 11] Original Supervisor verifying repair and providing digital signature..." -ForegroundColor Yellow
# Sample base64 dummy signature image
$dummySigBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

$supApproveReq = @{
    stage = "SUPERVISOR";
    status = "APPROVED";
    remarks = "Test component machined. Coolant flow and pump operation verified OK.";
    signatureType = "DRAWN";
    signatureBase64 = $dummySigBase64;
    productionRestoredAt = (Get-Date).ToString("o")
} | ConvertTo-Json

$supApprovedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/approval" -Method Post -ContentType "application/json" -Body $supApproveReq -Headers $supHeaders
Write-Host "Supervisor Verified! Status: $($supApprovedTicket.currentStatus) (Awaiting Incharge)" -ForegroundColor Green
if ($supApprovedTicket.currentStatus -ne "AWAITING_INCHARGE") { throw "Status expected AWAITING_INCHARGE" }

# 5. Maintenance Incharge Final Sign-off & Closure (Stage 2)
Write-Host "`n[Step 12] Maintenance Incharge executing final sign-off & ticket closure..." -ForegroundColor Yellow
$incApproveReq = @{
    stage = "INCHARGE";
    status = "APPROVED";
    remarks = "Electrical repair and fuse replacement verified. Stoppage logged and resolved in accordance with standard procedure.";
    signatureType = "DRAWN";
    signatureBase64 = $dummySigBase64
} | ConvertTo-Json

$finalClosedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/approval" -Method Post -ContentType "application/json" -Body $incApproveReq -Headers $incHeaders
Write-Host "Final Incharge Approval Successful! Status: $($finalClosedTicket.currentStatus)" -ForegroundColor Green
if ($finalClosedTicket.currentStatus -ne "CLOSED") { throw "Status expected CLOSED" }

Write-Host "`n[Step 13] Verifying Closure Attributes..." -ForegroundColor Yellow
Write-Host "Total Downtime Minutes: $($finalClosedTicket.totalDowntimeMinutes)" -ForegroundColor Cyan
Write-Host "Response Time Minutes: $($finalClosedTicket.responseTimeMinutes)" -ForegroundColor Cyan
Write-Host "Active Labor Minutes: $($finalClosedTicket.activeLaborMinutes)" -ForegroundColor Cyan
Write-Host "Approval Delay Minutes: $($finalClosedTicket.approvalDelayMinutes)" -ForegroundColor Cyan
Write-Host "Production Restored At: $($finalClosedTicket.productionRestoredAt)" -ForegroundColor Cyan
Write-Host "Closed At: $($finalClosedTicket.closedAt)" -ForegroundColor Cyan

# 6. Reopen Test
Write-Host "`n[Step 14] Reopening ticket with authorized reason..." -ForegroundColor Yellow
$reopenReq = @{ reason = "Machine tripped again after 30 minutes of high-speed turning trial." } | ConvertTo-Json
$reopenedTicket = Invoke-RestMethod -Uri "$baseUrl/tickets/$ticketId/reopen" -Method Post -ContentType "application/json" -Body $reopenReq -Headers $supHeaders
Write-Host "Reopen Successful! Current Status: $($reopenedTicket.currentStatus), Current Round: $($reopenedTicket.currentApprovalRound)" -ForegroundColor Green

if ($reopenedTicket.currentStatus -ne "REOPENED") { throw "Status expected REOPENED" }
if ($reopenedTicket.currentApprovalRound -ne 2) { throw "Expected ApprovalRound = 2" }

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "ALL ACCEPTANCE VERIFICATION SCENARIOS PASSED WITH 100% SUCCESS!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

