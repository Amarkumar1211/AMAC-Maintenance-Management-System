USE MBMS_Production;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Add SectionId to Employees table if not exists
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Employees' AND COLUMN_NAME = 'SectionId'
)
BEGIN
    ALTER TABLE Employees ADD SectionId INT NULL;
    
    ALTER TABLE Employees ADD CONSTRAINT FK_Employees_Sections 
        FOREIGN KEY (SectionId) REFERENCES ProductionSections(SectionId);
    
    PRINT 'Added SectionId column and foreign key to Employees table.';
END
GO

-- 2. Add SectionId to Mechanics table if not exists
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Mechanics' AND COLUMN_NAME = 'SectionId'
)
BEGIN
    ALTER TABLE Mechanics ADD SectionId INT NULL;
    
    ALTER TABLE Mechanics ADD CONSTRAINT FK_Mechanics_Sections 
        FOREIGN KEY (SectionId) REFERENCES ProductionSections(SectionId);
    
    PRINT 'Added SectionId column and foreign key to Mechanics table.';
END
GO

-- 3. Ensure all Plant Sections exist in ProductionSections
DECLARE @ProdDeptId INT = (SELECT TOP 1 DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-PROD');
DECLARE @MaintDeptId INT = (SELECT TOP 1 DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-MAINT');
DECLARE @MachDeptId INT = (SELECT TOP 1 DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-MACH');
DECLARE @StampDeptId INT = (SELECT TOP 1 DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-STAMP');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-LINE1')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@ProdDeptId, 'SEC-LINE1', 'Main Assembly Line 1');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-LINE2')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@ProdDeptId, 'SEC-LINE2', 'Sub-Assembly Line 2');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-CNC1')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@MachDeptId, 'SEC-CNC1', 'CNC Milling Bay');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-CNC2')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@MachDeptId, 'SEC-CNC2', 'CNC Turning Lathe Bay');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-PRESS1')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@StampDeptId, 'SEC-PRESS1', 'Hydraulic Press Bay A');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-PRESS2')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@StampDeptId, 'SEC-PRESS2', 'Mechanical Press Bay B');

IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-UTIL1')
    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES (@MaintDeptId, 'SEC-UTIL1', 'Compressor & Utility Bay');
GO

-- 4. Update Machines with accurate SectionId
DECLARE @SecLine1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-LINE1');
DECLARE @SecLine2 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-LINE2');
DECLARE @SecCnc1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-CNC1');
DECLARE @SecCnc2 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-CNC2');
DECLARE @SecPress1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-PRESS1');
DECLARE @SecUtil1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-UTIL1');

UPDATE Machines SET SectionId = @SecCnc1 WHERE MachineCode = 'MCH-CNC-001';
UPDATE Machines SET SectionId = @SecCnc1 WHERE MachineCode = 'MCH-CNC-002';
UPDATE Machines SET SectionId = @SecPress1 WHERE MachineCode = 'MCH-PRS-001';
UPDATE Machines SET SectionId = @SecPress1 WHERE MachineCode = 'MCH-PRS-002';
UPDATE Machines SET SectionId = @SecLine1 WHERE MachineCode = 'MCH-ASY-001';
UPDATE Machines SET SectionId = @SecLine1 WHERE MachineCode = 'MCH-ASY-002';
UPDATE Machines SET SectionId = @SecLine2 WHERE MachineCode = 'MCH-INJ-001';
UPDATE Machines SET SectionId = @SecUtil1 WHERE MachineCode = 'MCH-UTL-001';
GO

-- 5. Seed Supervisor 3 for Press & Stamping Shop if not exists
DECLARE @StampDeptId INT = (SELECT TOP 1 DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-STAMP');
DECLARE @SecPress1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-PRESS1');
DECLARE @SupervisorRoleId INT = (SELECT TOP 1 RoleId FROM Roles WHERE RoleName = 'SUPERVISOR');

IF NOT EXISTS (SELECT 1 FROM Employees WHERE EmployeeCode = 'EMP-SUP-03')
BEGIN
    INSERT INTO Employees (EmployeeCode, EmployeeName, DepartmentId, SectionId, Designation, MobileNumber, Email)
    VALUES ('EMP-SUP-03', N'Vikram Joshi', @StampDeptId, @SecPress1, N'Stamping Press Shop Supervisor', N'+91 98230 45679', N'vikram.joshi@factory.lan');

    DECLARE @NewEmpId INT = SCOPE_IDENTITY();
    -- Password hash for 'Supervisor@123' (BCrypt standard used in DbInitializer)
    DECLARE @PasswordHash NVARCHAR(500) = (SELECT TOP 1 PasswordHash FROM Users WHERE Username = 'supervisor1');

    INSERT INTO Users (EmployeeId, Username, PasswordHash, IsActive)
    VALUES (@NewEmpId, 'supervisor3', @PasswordHash, 1);

    DECLARE @NewUserId INT = SCOPE_IDENTITY();
    INSERT INTO UserRoles (UserId, RoleId) VALUES (@NewUserId, @SupervisorRoleId);
END
GO

-- 6. Assign Sections to Employees & Mechanics
DECLARE @SecLine1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-LINE1');
DECLARE @SecLine2 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-LINE2');
DECLARE @SecCnc1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-CNC1');
DECLARE @SecPress1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-PRESS1');
DECLARE @SecUtil1 INT = (SELECT TOP 1 SectionId FROM ProductionSections WHERE SectionCode = 'SEC-UTIL1');

-- Shift Supervisors Section Mapping
UPDATE Employees SET SectionId = @SecLine1 WHERE EmployeeCode = 'EMP-SUP-01'; -- Amit Verma -> Assembly Line 1
UPDATE Employees SET SectionId = @SecCnc1 WHERE EmployeeCode = 'EMP-SUP-02';  -- Suresh Patel -> CNC Milling Bay
UPDATE Employees SET SectionId = @SecPress1 WHERE EmployeeCode = 'EMP-SUP-03'; -- Vikram Joshi -> Hydraulic Press Bay A

-- Field Mechanics Section Mapping (Dedicated plant sections + Plant Maintenance)
UPDATE Employees SET SectionId = @SecCnc1 WHERE EmployeeCode = 'EMP-MCH-01';  -- Ramesh Yadav -> CNC Milling Bay
UPDATE Employees SET SectionId = @SecPress1 WHERE EmployeeCode = 'EMP-MCH-02'; -- Santosh Kumar -> Hydraulic Press Bay A
UPDATE Employees SET SectionId = @SecLine1 WHERE EmployeeCode = 'EMP-MCH-03'; -- Vikram Singh -> Assembly Line 1
UPDATE Employees SET SectionId = @SecLine2 WHERE EmployeeCode = 'EMP-MCH-04'; -- Dinesh Verma -> Sub-Assembly Line 2
UPDATE Employees SET SectionId = @SecUtil1 WHERE EmployeeCode = 'EMP-MCH-05'; -- Sachin Patil -> Compressor & Utilities
UPDATE Employees SET SectionId = @SecCnc1 WHERE EmployeeCode = 'EMP-MCH-06';  -- Anil Vishwakarma -> CNC Spindle & Tooling
UPDATE Employees SET SectionId = @SecLine1 WHERE EmployeeCode = 'EMP-MCH-07'; -- Mukesh Maurya -> Preventive Maintenance
UPDATE Employees SET SectionId = @SecPress1 WHERE EmployeeCode = 'EMP-MCH-08'; -- Sunil Jha -> Pneumatics & Valves
UPDATE Employees SET SectionId = @SecPress1 WHERE EmployeeCode = 'EMP-MCH-09'; -- Pradeep Chauhan -> Heavy Press Shop
UPDATE Employees SET SectionId = NULL WHERE EmployeeCode = 'EMP-MCH-10';      -- Pankaj Tiwari -> General Maintenance (All Sections)

-- Synchronize Mechanics table SectionId with Employees
UPDATE m
SET m.SectionId = e.SectionId
FROM Mechanics m
JOIN Employees e ON m.EmployeeId = e.EmployeeId;

-- Incharge & Admin have NULL SectionId (Plant-wide access across all sections)
UPDATE Employees SET SectionId = NULL WHERE EmployeeCode = 'EMP-ADMIN';
UPDATE Employees SET SectionId = NULL WHERE EmployeeCode = 'EMP-INC-01';
GO

-- 7. Verification Query
SELECT 
    e.EmployeeId,
    e.EmployeeCode,
    e.EmployeeName,
    d.DepartmentName,
    COALESCE(s.SectionName, N'-- ALL SECTIONS (PLANT-WIDE) --') AS AssignedSection,
    u.Username,
    r.RoleName
FROM Employees e
JOIN Departments d ON e.DepartmentId = d.DepartmentId
LEFT JOIN ProductionSections s ON e.SectionId = s.SectionId
LEFT JOIN Users u ON e.EmployeeId = u.EmployeeId
LEFT JOIN UserRoles ur ON u.UserId = ur.UserId
LEFT JOIN Roles r ON ur.RoleId = r.RoleId
ORDER BY e.EmployeeId;
GO
