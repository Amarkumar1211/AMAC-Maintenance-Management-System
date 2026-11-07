-- =======================================================================
-- INDUSTRIAL MAINTENANCE: MACHINE BREAKDOWN & MAINTENANCE MANAGEMENT SYSTEM
-- Complete SQL Server 2022 Production Schema and Seed Data
-- =======================================================================

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MBMS_Production')
BEGIN
    CREATE DATABASE MBMS_Production;
END
GO

USE MBMS_Production;
GO

SET ANSI_NULLS ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Departments Master
IF OBJECT_ID('Departments', 'U') IS NULL
BEGIN
    CREATE TABLE Departments (
        DepartmentId INT IDENTITY(1,1) PRIMARY KEY,
        DepartmentCode NVARCHAR(30) NOT NULL UNIQUE,
        DepartmentName NVARCHAR(100) NOT NULL UNIQUE,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- 2. Production Sections Master
IF OBJECT_ID('ProductionSections', 'U') IS NULL
BEGIN
    CREATE TABLE ProductionSections (
        SectionId INT IDENTITY(1,1) PRIMARY KEY,
        DepartmentId INT NOT NULL,
        SectionCode NVARCHAR(30) NOT NULL UNIQUE,
        SectionName NVARCHAR(100) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Sections_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId)
    );
END
GO

-- 3. Shifts Master
IF OBJECT_ID('Shifts', 'U') IS NULL
BEGIN
    CREATE TABLE Shifts (
        ShiftId INT IDENTITY(1,1) PRIMARY KEY,
        ShiftName NVARCHAR(50) NOT NULL UNIQUE,
        StartTime TIME NOT NULL,
        EndTime TIME NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1
    );
END
GO

-- 4. Employees Master
IF OBJECT_ID('Employees', 'U') IS NULL
BEGIN
    CREATE TABLE Employees (
        EmployeeId INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeCode NVARCHAR(30) NOT NULL UNIQUE,
        EmployeeName NVARCHAR(150) NOT NULL,
        MobileNumber NVARCHAR(20),
        Email NVARCHAR(150),
        DepartmentId INT NOT NULL,
        SectionId INT NULL,
        Designation NVARCHAR(100),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Employees_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId),
        CONSTRAINT FK_Employees_Sections FOREIGN KEY (SectionId) REFERENCES ProductionSections(SectionId)
    );
END
GO

-- 5. Roles Master
IF OBJECT_ID('Roles', 'U') IS NULL
BEGIN
    CREATE TABLE Roles (
        RoleId INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(200)
    );
END
GO

-- 6. Users (Authentication Accounts)
IF OBJECT_ID('Users', 'U') IS NULL
BEGIN
    CREATE TABLE Users (
        UserId INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeId INT NOT NULL UNIQUE,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        PasswordHash NVARCHAR(500) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        LastLoginAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Users_Employees FOREIGN KEY (EmployeeId) REFERENCES Employees(EmployeeId)
    );
END
GO

-- 7. UserRoles Mapping
IF OBJECT_ID('UserRoles', 'U') IS NULL
BEGIN
    CREATE TABLE UserRoles (
        UserId INT NOT NULL,
        RoleId INT NOT NULL,
        CONSTRAINT PK_UserRoles PRIMARY KEY (UserId, RoleId),
        CONSTRAINT FK_UserRoles_Users FOREIGN KEY (UserId) REFERENCES Users(UserId) ON DELETE CASCADE,
        CONSTRAINT FK_UserRoles_Roles FOREIGN KEY (RoleId) REFERENCES Roles(RoleId) ON DELETE CASCADE
    );
END
GO

-- 8. Mechanic Specializations
IF OBJECT_ID('MechanicSpecializations', 'U') IS NULL
BEGIN
    CREATE TABLE MechanicSpecializations (
        SpecializationId INT IDENTITY(1,1) PRIMARY KEY,
        SpecializationName NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(255)
    );
END
GO

-- 9. Mechanics Master
IF OBJECT_ID('Mechanics', 'U') IS NULL
BEGIN
    CREATE TABLE Mechanics (
        MechanicId INT IDENTITY(1,1) PRIMARY KEY,
        EmployeeId INT NOT NULL UNIQUE,
        SectionId INT NULL,
        Specialization NVARCHAR(150),
        ShiftName NVARCHAR(50),
        IsAvailable BIT NOT NULL DEFAULT 1,
        ActiveTicketCount INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_Mechanics_Employees FOREIGN KEY (EmployeeId) REFERENCES Employees(EmployeeId),
        CONSTRAINT FK_Mechanics_Sections FOREIGN KEY (SectionId) REFERENCES ProductionSections(SectionId)
    );
END
GO

-- 10. Machine Categories
IF OBJECT_ID('MachineCategories', 'U') IS NULL
BEGIN
    CREATE TABLE MachineCategories (
        MachineCategoryId INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(255),
        IsActive BIT NOT NULL DEFAULT 1
    );
END
GO

-- 11. Machines Master (250+ machines capacity)
IF OBJECT_ID('Machines', 'U') IS NULL
BEGIN
    CREATE TABLE Machines (
        MachineId INT IDENTITY(1,1) PRIMARY KEY,
        MachineCode NVARCHAR(50) NOT NULL UNIQUE,
        MachineName NVARCHAR(150) NOT NULL,
        DepartmentId INT NOT NULL,
        SectionId INT NULL,
        MachineCategoryId INT NULL,
        MachineCategory NVARCHAR(100),
        Location NVARCHAR(150),
        Manufacturer NVARCHAR(150),
        ModelNumber NVARCHAR(100),
        SerialNumber NVARCHAR(100),
        InstallationDate DATE,
        Criticality NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        QRCode NVARCHAR(100) NULL,
        MachineImagePath NVARCHAR(500),
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Machines_Departments FOREIGN KEY (DepartmentId) REFERENCES Departments(DepartmentId),
        CONSTRAINT FK_Machines_Sections FOREIGN KEY (SectionId) REFERENCES ProductionSections(SectionId),
        CONSTRAINT FK_Machines_Categories FOREIGN KEY (MachineCategoryId) REFERENCES MachineCategories(MachineCategoryId),
        CONSTRAINT CK_Machines_Criticality CHECK (Criticality IN ('LOW','MEDIUM','HIGH','CRITICAL'))
    );
END
GO

-- 12. Breakdown Failure Categories Master
IF OBJECT_ID('BreakdownCategories', 'U') IS NULL
BEGIN
    CREATE TABLE BreakdownCategories (
        CategoryId INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL UNIQUE,
        Description NVARCHAR(500),
        IsActive BIT NOT NULL DEFAULT 1
    );
END
GO

-- 13. Breakdown Tickets (Core Incident)
IF OBJECT_ID('BreakdownTickets', 'U') IS NULL
BEGIN
    CREATE TABLE BreakdownTickets (
        TicketId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketNumber NVARCHAR(40) NOT NULL UNIQUE,
        MachineId INT NOT NULL,
        SupervisorId INT NOT NULL,
        CategoryId INT NOT NULL,
        BreakdownOccurredAt DATETIME2 NOT NULL,
        ReportedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        BreakdownReason NVARCHAR(500) NOT NULL,
        BreakdownDescription NVARCHAR(MAX) NOT NULL,
        MachineCondition NVARCHAR(50),
        ProductionImpact NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        Priority NVARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
        CurrentStatus NVARCHAR(40) NOT NULL DEFAULT 'NEW',
        CurrentApprovalRound INT NOT NULL DEFAULT 1,
        RepairCompletedAt DATETIME2 NULL,
        ProductionRestoredAt DATETIME2 NULL,
        ClosedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        RowVersion ROWVERSION NOT NULL,
        CONSTRAINT FK_Tickets_Machines FOREIGN KEY (MachineId) REFERENCES Machines(MachineId),
        CONSTRAINT FK_Tickets_Supervisor FOREIGN KEY (SupervisorId) REFERENCES Employees(EmployeeId),
        CONSTRAINT FK_Tickets_Categories FOREIGN KEY (CategoryId) REFERENCES BreakdownCategories(CategoryId),
        CONSTRAINT CK_Tickets_Priority CHECK (Priority IN ('LOW','MEDIUM','HIGH','CRITICAL')),
        CONSTRAINT CK_Tickets_Status CHECK (CurrentStatus IN (
            'NEW','ASSIGNED','ACCEPTED','IN_PROGRESS','ON_HOLD',
            'AWAITING_SUPERVISOR','SUPERVISOR_REJECTED',
            'AWAITING_INCHARGE','INCHARGE_REJECTED',
            'CLOSED','REOPENED','CANCELLED'
        ))
    );
END
GO

-- 14. Ticket Assignments (History & Active Mechanic)
IF OBJECT_ID('TicketAssignments', 'U') IS NULL
BEGIN
    CREATE TABLE TicketAssignments (
        AssignmentId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        MechanicId INT NOT NULL,
        AssignedBy INT NOT NULL,
        AssignedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        AcceptedAt DATETIME2 NULL,
        AssignmentRemarks NVARCHAR(500),
        IsCurrent BIT NOT NULL DEFAULT 1,
        CONSTRAINT FK_Assignments_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_Assignments_Mechanics FOREIGN KEY (MechanicId) REFERENCES Mechanics(MechanicId),
        CONSTRAINT FK_Assignments_AssignedBy FOREIGN KEY (AssignedBy) REFERENCES Employees(EmployeeId)
    );
END
GO

-- 15. Maintenance Actions (Inspection, Root Cause & Corrective Action)
IF OBJECT_ID('MaintenanceActions', 'U') IS NULL
BEGIN
    CREATE TABLE MaintenanceActions (
        ActionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        MechanicId INT NOT NULL,
        ApprovalRound INT NOT NULL DEFAULT 1,
        InspectionFindings NVARCHAR(MAX),
        ActualRootCause NVARCHAR(MAX),
        ActionTaken NVARCHAR(MAX) NOT NULL,
        StartedAt DATETIME2 NOT NULL,
        CompletedAt DATETIME2 NULL,
        MachineConditionAfterRepair NVARCHAR(100),
        MechanicRemarks NVARCHAR(MAX),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Actions_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_Actions_Mechanics FOREIGN KEY (MechanicId) REFERENCES Mechanics(MechanicId),
        CONSTRAINT CK_Actions_Time CHECK (CompletedAt IS NULL OR CompletedAt >= StartedAt)
    );
END
GO

-- 16. Ticket Work Sessions (Pause, Resume, Detailed Labor Duration)
IF OBJECT_ID('TicketWorkSessions', 'U') IS NULL
BEGIN
    CREATE TABLE TicketWorkSessions (
        SessionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        ActionId BIGINT NULL,
        MechanicId INT NOT NULL,
        SessionType NVARCHAR(30) NOT NULL DEFAULT 'WORK', -- WORK, ON_HOLD
        StartedAt DATETIME2 NOT NULL,
        EndedAt DATETIME2 NULL,
        HoldReason NVARCHAR(500) NULL,
        Notes NVARCHAR(MAX) NULL,
        CONSTRAINT FK_WorkSessions_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_WorkSessions_Actions FOREIGN KEY (ActionId) REFERENCES MaintenanceActions(ActionId),
        CONSTRAINT FK_WorkSessions_Mechanics FOREIGN KEY (MechanicId) REFERENCES Mechanics(MechanicId),
        CONSTRAINT CK_WorkSessions_Time CHECK (EndedAt IS NULL OR EndedAt >= StartedAt)
    );
END
GO

-- 17. Spare Parts Master
IF OBJECT_ID('SpareParts', 'U') IS NULL
BEGIN
    CREATE TABLE SpareParts (
        PartId INT IDENTITY(1,1) PRIMARY KEY,
        PartCode NVARCHAR(50) NOT NULL UNIQUE,
        PartName NVARCHAR(150) NOT NULL,
        Unit NVARCHAR(30),
        Description NVARCHAR(500),
        UnitPrice DECIMAL(18,2) DEFAULT 0.00,
        StockQuantity DECIMAL(18,3) DEFAULT 0,
        IsActive BIT NOT NULL DEFAULT 1
    );
END
GO

-- 18. Parts Used in Maintenance
IF OBJECT_ID('PartsUsed', 'U') IS NULL
BEGIN
    CREATE TABLE PartsUsed (
        PartsUsedId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ActionId BIGINT NOT NULL,
        PartId INT NOT NULL,
        Quantity DECIMAL(18,3) NOT NULL,
        Remarks NVARCHAR(500),
        CONSTRAINT FK_PartsUsed_Actions FOREIGN KEY (ActionId) REFERENCES MaintenanceActions(ActionId),
        CONSTRAINT FK_PartsUsed_Parts FOREIGN KEY (PartId) REFERENCES SpareParts(PartId),
        CONSTRAINT CK_PartsUsed_Quantity CHECK (Quantity > 0)
    );
END
GO

-- 19. Ticket Attachments (Images, Pre/Post Photos)
IF OBJECT_ID('TicketAttachments', 'U') IS NULL
BEGIN
    CREATE TABLE TicketAttachments (
        AttachmentId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        ActionId BIGINT NULL,
        UploadedBy INT NOT NULL,
        AttachmentType NVARCHAR(30) NOT NULL,
        OriginalFileName NVARCHAR(255),
        StoredFileName NVARCHAR(255) NOT NULL,
        FilePath NVARCHAR(500) NOT NULL,
        FileSize BIGINT NULL,
        ContentType NVARCHAR(100) NULL,
        UploadedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Attachments_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_Attachments_Actions FOREIGN KEY (ActionId) REFERENCES MaintenanceActions(ActionId),
        CONSTRAINT FK_Attachments_Employees FOREIGN KEY (UploadedBy) REFERENCES Employees(EmployeeId),
        CONSTRAINT CK_Attachments_Type CHECK (AttachmentType IN ('BREAKDOWN','INSPECTION','REPAIR','OTHER'))
    );
END
GO

-- 20. Ticket Approvals (Two-Stage: Supervisor & Incharge)
IF OBJECT_ID('TicketApprovals', 'U') IS NULL
BEGIN
    CREATE TABLE TicketApprovals (
        ApprovalId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        ApprovalRound INT NOT NULL DEFAULT 1,
        ApprovalStage NVARCHAR(30) NOT NULL,
        ApproverId INT NOT NULL,
        ApprovalStatus NVARCHAR(20) NOT NULL,
        Remarks NVARCHAR(MAX),
        ApprovedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Approvals_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_Approvals_Employees FOREIGN KEY (ApproverId) REFERENCES Employees(EmployeeId),
        CONSTRAINT CK_Approvals_Stage CHECK (ApprovalStage IN ('SUPERVISOR','INCHARGE')),
        CONSTRAINT CK_Approvals_Status CHECK (ApprovalStatus IN ('PENDING','APPROVED','REJECTED')),
        CONSTRAINT CK_Approvals_Round CHECK (ApprovalRound >= 1)
    );
END
GO

-- 21. Ticket Signatures (Drawn / Uploaded)
IF OBJECT_ID('TicketSignatures', 'U') IS NULL
BEGIN
    CREATE TABLE TicketSignatures (
        SignatureId BIGINT IDENTITY(1,1) PRIMARY KEY,
        ApprovalId BIGINT NOT NULL UNIQUE,
        SignatureType NVARCHAR(20) NOT NULL,
        FilePath NVARCHAR(500) NOT NULL,
        OriginalFileName NVARCHAR(255),
        SignedBy INT NOT NULL,
        SignedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Signatures_Approvals FOREIGN KEY (ApprovalId) REFERENCES TicketApprovals(ApprovalId),
        CONSTRAINT FK_Signatures_Employees FOREIGN KEY (SignedBy) REFERENCES Employees(EmployeeId),
        CONSTRAINT CK_Signatures_Type CHECK (SignatureType IN ('DRAWN','UPLOADED'))
    );
END
GO

-- 22. Ticket Comments (Internal Communication)
IF OBJECT_ID('TicketComments', 'U') IS NULL
BEGIN
    CREATE TABLE TicketComments (
        CommentId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        EmployeeId INT NOT NULL,
        CommentText NVARCHAR(MAX) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Comments_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_Comments_Employees FOREIGN KEY (EmployeeId) REFERENCES Employees(EmployeeId)
    );
END
GO

-- 23. Ticket Status History (Immutable Audit Trail)
IF OBJECT_ID('TicketStatusHistory', 'U') IS NULL
BEGIN
    CREATE TABLE TicketStatusHistory (
        HistoryId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        PreviousStatus NVARCHAR(40),
        NewStatus NVARCHAR(40) NOT NULL,
        ChangedBy INT NOT NULL,
        ChangeRemarks NVARCHAR(1000),
        ChangedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_StatusHistory_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_StatusHistory_Employees FOREIGN KEY (ChangedBy) REFERENCES Employees(EmployeeId)
    );
END
GO

-- 24. Machine Downtime Intervals (Multi-interval per ticket)
IF OBJECT_ID('MachineDowntime', 'U') IS NULL
BEGIN
    CREATE TABLE MachineDowntime (
        DowntimeId BIGINT IDENTITY(1,1) PRIMARY KEY,
        TicketId BIGINT NOT NULL,
        MachineId INT NOT NULL,
        StartedAt DATETIME2 NOT NULL,
        RestoredAt DATETIME2 NULL,
        RestorationRemarks NVARCHAR(1000),
        RecordedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Downtime_Tickets FOREIGN KEY (TicketId) REFERENCES BreakdownTickets(TicketId),
        CONSTRAINT FK_Downtime_Machines FOREIGN KEY (MachineId) REFERENCES Machines(MachineId),
        CONSTRAINT CK_Downtime_Time CHECK (RestoredAt IS NULL OR RestoredAt >= StartedAt)
    );
END
GO

-- 25. Audit Logs
IF OBJECT_ID('AuditLogs', 'U') IS NULL
BEGIN
    CREATE TABLE AuditLogs (
        AuditId BIGINT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        TableName NVARCHAR(100),
        RecordId NVARCHAR(100),
        OldValue NVARCHAR(MAX),
        NewValue NVARCHAR(MAX),
        IPAddress NVARCHAR(50),
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_AuditLogs_Users FOREIGN KEY (UserId) REFERENCES Users(UserId)
    );
END
GO

-- 26. SLA Configurations Master
IF OBJECT_ID('SLAConfigurations', 'U') IS NULL
BEGIN
    CREATE TABLE SLAConfigurations (
        SLAId INT IDENTITY(1,1) PRIMARY KEY,
        Priority NVARCHAR(20) NOT NULL UNIQUE,
        ResponseTargetMinutes INT NOT NULL,
        ResolutionTargetMinutes INT NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CONSTRAINT CK_SLA_Response CHECK (ResponseTargetMinutes > 0),
        CONSTRAINT CK_SLA_Resolution CHECK (ResolutionTargetMinutes > 0),
        CONSTRAINT CK_SLA_Priority CHECK (Priority IN ('LOW','MEDIUM','HIGH','CRITICAL'))
    );
END
GO

-- 27. Machine QR Records
IF OBJECT_ID('MachineQRRecords', 'U') IS NULL
BEGIN
    CREATE TABLE MachineQRRecords (
        QRRecordId BIGINT IDENTITY(1,1) PRIMARY KEY,
        MachineId INT NOT NULL UNIQUE,
        QRCodePayload NVARCHAR(255) NOT NULL,
        GeneratedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_QR_Machines FOREIGN KEY (MachineId) REFERENCES Machines(MachineId)
    );
END
GO

-- 28. System Settings
IF OBJECT_ID('SystemSettings', 'U') IS NULL
BEGIN
    CREATE TABLE SystemSettings (
        SettingKey NVARCHAR(50) PRIMARY KEY,
        SettingValue NVARCHAR(500) NOT NULL,
        Description NVARCHAR(255)
    );
END
GO

-- 29. Mandatory Indexes & Unique Integrity Rules
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_TicketAssignments_Current' AND object_id = OBJECT_ID('TicketAssignments'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketAssignments_Current
    ON TicketAssignments(TicketId)
    WHERE IsCurrent = 1;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_MachineDowntime_Open' AND object_id = OBJECT_ID('MachineDowntime'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_MachineDowntime_Open
    ON MachineDowntime(TicketId)
    WHERE RestoredAt IS NULL;
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_TicketApprovals_Stage' AND object_id = OBJECT_ID('TicketApprovals'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_TicketApprovals_Stage
    ON TicketApprovals(TicketId, ApprovalRound, ApprovalStage);
END
GO

-- Standard query performance indexes
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_Machine_Date' AND object_id = OBJECT_ID('BreakdownTickets'))
BEGIN
    CREATE INDEX IX_Tickets_Machine_Date ON BreakdownTickets(MachineId, BreakdownOccurredAt);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_Status_Reported' AND object_id = OBJECT_ID('BreakdownTickets'))
BEGIN
    CREATE INDEX IX_Tickets_Status_Reported ON BreakdownTickets(CurrentStatus, ReportedAt);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tickets_Supervisor_Date' AND object_id = OBJECT_ID('BreakdownTickets'))
BEGIN
    CREATE INDEX IX_Tickets_Supervisor_Date ON BreakdownTickets(SupervisorId, ReportedAt);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Assignments_Mechanic_Current' AND object_id = OBJECT_ID('TicketAssignments'))
BEGIN
    CREATE INDEX IX_Assignments_Mechanic_Current ON TicketAssignments(MechanicId, IsCurrent);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Maintenance_Ticket_Started' AND object_id = OBJECT_ID('MaintenanceActions'))
BEGIN
    CREATE INDEX IX_Maintenance_Ticket_Started ON MaintenanceActions(TicketId, StartedAt);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Downtime_Machine_Started' AND object_id = OBJECT_ID('MachineDowntime'))
BEGIN
    CREATE INDEX IX_Downtime_Machine_Started ON MachineDowntime(MachineId, StartedAt);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_StatusHistory_Ticket_Time' AND object_id = OBJECT_ID('TicketStatusHistory'))
BEGIN
    CREATE INDEX IX_StatusHistory_Ticket_Time ON TicketStatusHistory(TicketId, ChangedAt);
END
GO

-- =======================================================================
-- SEED DATA
-- =======================================================================

-- Roles
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'ADMIN')
    INSERT INTO Roles(RoleName, Description) VALUES ('ADMIN', 'System Administrator with full access');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'SUPERVISOR')
    INSERT INTO Roles(RoleName, Description) VALUES ('SUPERVISOR', 'Production Supervisor reporting breakdowns & verifying repairs');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'MAINTENANCE_INCHARGE')
    INSERT INTO Roles(RoleName, Description) VALUES ('MAINTENANCE_INCHARGE', 'Maintenance Incharge managing mechanic assignments & approvals');
IF NOT EXISTS (SELECT 1 FROM Roles WHERE RoleName = 'MECHANIC')
    INSERT INTO Roles(RoleName, Description) VALUES ('MECHANIC', 'Maintenance Technician executing repairs');
GO

-- Breakdown Categories
IF NOT EXISTS (SELECT 1 FROM BreakdownCategories WHERE CategoryName = 'Electrical')
BEGIN
    INSERT INTO BreakdownCategories (CategoryName, Description) VALUES
    ('Electrical', 'Power failure, short circuit, breaker trip, wiring fault'),
    ('Mechanical', 'Gear tooth break, shaft alignment, bearing jam, vibration'),
    ('Hydraulic', 'Pressure drop, oil leakage, pump failure, cylinder seal burst'),
    ('Pneumatic', 'Air leakage, valve failure, compressor pressure fault'),
    ('Automation & PLC', 'PLC I/O fault, drive fault, communication error'),
    ('Sensor Failure', 'Proximity, optical, encoder, limit switch error'),
    ('Motor Failure', 'Motor burn, overheating, insulation failure, rotor issue'),
    ('Bearing Failure', 'Bearing seizure, wear and tear, excessive heat/noise'),
    ('Gearbox Failure', 'Oil starvation, gear tooth damage, excessive play'),
    ('Other', 'Uncategorized or miscellaneous plant breakdown');
END
GO

-- SLA Configurations
IF NOT EXISTS (SELECT 1 FROM SLAConfigurations WHERE Priority = 'CRITICAL')
BEGIN
    INSERT INTO SLAConfigurations (Priority, ResponseTargetMinutes, ResolutionTargetMinutes) VALUES
    ('CRITICAL', 5, 120),
    ('HIGH', 15, 240),
    ('MEDIUM', 30, 480),
    ('LOW', 60, 1440);
END
GO

-- Departments
IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentCode = 'DEPT-PROD')
BEGIN
    INSERT INTO Departments (DepartmentCode, DepartmentName) VALUES
    ('DEPT-PROD', 'Production & Assembly'),
    ('DEPT-MAINT', 'Plant Maintenance & Engineering'),
    ('DEPT-MACH', 'Machining & CNC Shop'),
    ('DEPT-STAMP', 'Press & Stamping Shop'),
    ('DEPT-PAINT', 'Surface Treatment & Paint Shop');
END
GO

-- Production Sections
IF NOT EXISTS (SELECT 1 FROM ProductionSections WHERE SectionCode = 'SEC-LINE1')
BEGIN
    DECLARE @ProdDeptId INT = (SELECT DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-PROD');
    DECLARE @MachDeptId INT = (SELECT DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-MACH');
    DECLARE @StampDeptId INT = (SELECT DepartmentId FROM Departments WHERE DepartmentCode = 'DEPT-STAMP');

    INSERT INTO ProductionSections (DepartmentId, SectionCode, SectionName) VALUES
    (@ProdDeptId, 'SEC-LINE1', 'Main Assembly Line 1'),
    (@ProdDeptId, 'SEC-LINE2', 'Sub-Assembly Line 2'),
    (@MachDeptId, 'SEC-CNC1', 'CNC Milling Section'),
    (@MachDeptId, 'SEC-CNC2', 'CNC Lathe Section'),
    (@StampDeptId, 'SEC-PRESS1', 'Hydraulic Press Bay A');
END
GO

-- Shifts
IF NOT EXISTS (SELECT 1 FROM Shifts WHERE ShiftName = 'Morning Shift (A)')
BEGIN
    INSERT INTO Shifts (ShiftName, StartTime, EndTime) VALUES
    ('Morning Shift (A)', '06:00:00', '14:30:00'),
    ('General Shift (G)', '08:30:00', '17:00:00'),
    ('Evening Shift (B)', '14:30:00', '23:00:00'),
    ('Night Shift (C)', '23:00:00', '06:30:00');
END
GO

-- Machine Categories
IF NOT EXISTS (SELECT 1 FROM MachineCategories WHERE CategoryName = 'CNC Machine')
BEGIN
    INSERT INTO MachineCategories (CategoryName, Description) VALUES
    ('CNC Machine', 'Computer Numerical Control Mills, Lathes, Routers'),
    ('Hydraulic Press', 'High tonnage stamping, molding, shaping presses'),
    ('Conveyor System', 'Belt, roller, overhead automated conveyors'),
    ('Compressor & Utility', 'Industrial rotary screw air compressors, chillers'),
    ('Injection Molding', 'Plastic injection molding and blow molding machines'),
    ('Robotic Cell', 'Welding and pick-and-place articulated robots');
END
GO

-- Spare Parts Master Seed
IF NOT EXISTS (SELECT 1 FROM SpareParts WHERE PartCode = 'PART-BRG-6205')
BEGIN
    INSERT INTO SpareParts (PartCode, PartName, Unit, Description, UnitPrice, StockQuantity) VALUES
    ('PART-BRG-6205', 'Deep Groove Ball Bearing 6205-2RS', 'NOS', 'SKF standard motor shaft bearing', 450.00, 48),
    ('PART-BRG-6308', 'Heavy Duty Roller Bearing 6308', 'NOS', 'High load conveyor roller bearing', 980.00, 24),
    ('PART-HYD-SEAL-80', 'Hydraulic Piston Seal 80mm', 'SET', 'NBR double acting hydraulic cylinder seal', 1250.00, 15),
    ('PART-VALV-SOL-24V', 'Pneumatic Solenoid Valve 5/2 24VDC', 'NOS', 'Festo directional control valve', 2800.00, 10),
    ('PART-FUSE-32A', 'HRC Fuse Link 32A DIN Type', 'NOS', 'Siemens electrical panel safety fuse', 180.00, 85),
    ('PART-RELAY-24V', 'Industrial Control Relay 24VDC 4PDT', 'NOS', 'Omron miniature relay with base', 320.00, 40),
    ('PART-OIL-VG68', 'Hydraulic Oil ISO VG 68', 'LITERS', 'Shell Tellus S2 high performance fluid', 220.00, 400),
    ('PART-BELT-B52', 'Industrial V-Belt B-52', 'NOS', 'Continental heat resistant drive belt', 380.00, 30),
    ('PART-PROX-M18', 'Inductive Proximity Sensor M18 PNP NO', 'NOS', 'Autonics 8mm sensing range sensor', 1150.00, 18),
    ('PART-COUPL-FLEX', 'Flexible Jaw Coupling Spider 95mm', 'NOS', 'Polyurethane drive coupling insert', 550.00, 22);
END
GO

-- System Settings
IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = 'CompanyName')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES
    ('CompanyName', 'Industrial Precision Manufacturing Ltd.', 'Company legal name displayed on reports'),
    ('FacilityName', 'Unit 5 (U5) - Manufacturing Complex', 'Factory site identifier'),
    ('TicketPrefix', 'BD', 'Prefix for breakdown ticket numbering'),
    ('StorageBasePath', 'D:\MBMSData', 'Root path for local file storage'),
    ('MaxUploadSizeMB', '10', 'Maximum attachment size in megabytes'),
    ('AllowedExtensions', '.jpg,.jpeg,.png,.pdf', 'Allowed upload file extensions');
END
GO