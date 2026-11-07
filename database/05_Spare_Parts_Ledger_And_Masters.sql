USE MBMS_Production;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Create SparePartTransactions table
IF OBJECT_ID('SparePartTransactions', 'U') IS NULL
BEGIN
    CREATE TABLE SparePartTransactions (
        TransactionId BIGINT IDENTITY(1,1) PRIMARY KEY,
        PartId INT NOT NULL,
        TransactionType NVARCHAR(20) NOT NULL, -- 'INWARD' or 'OUTWARD'
        Quantity DECIMAL(18,3) NOT NULL,
        UnitPrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        ReferenceNo NVARCHAR(100) NULL,
        SupplierOrSource NVARCHAR(200) NULL,
        Remarks NVARCHAR(500) NULL,
        MachineId INT NULL,
        MechanicId INT NULL,
        TransactionDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CreatedBy NVARCHAR(100) NULL,
        CONSTRAINT FK_SparePartTransactions_Parts FOREIGN KEY (PartId) REFERENCES SpareParts(PartId),
        CONSTRAINT FK_SparePartTransactions_Machines FOREIGN KEY (MachineId) REFERENCES Machines(MachineId),
        CONSTRAINT FK_SparePartTransactions_Mechanics FOREIGN KEY (MechanicId) REFERENCES Mechanics(MechanicId)
    );
    PRINT 'Created SparePartTransactions table.';
END
GO

-- 2. Seed initial INWARD history if table is empty
IF NOT EXISTS (SELECT 1 FROM SparePartTransactions WHERE TransactionType = 'INWARD')
BEGIN
    INSERT INTO SparePartTransactions (PartId, TransactionType, Quantity, UnitPrice, ReferenceNo, SupplierOrSource, Remarks, TransactionDate, CreatedBy)
    SELECT 
        PartId, 
        'INWARD', 
        StockQuantity + 2.000, 
        UnitPrice, 
        CONCAT('GRN-U5-', 1000 + PartId), 
        N'Authorized Industrial OEM Vendor', 
        N'Initial Stock Inward & Commissioning Delivery for AMAC Unit 5', 
        DATEADD(DAY, -14, SYSUTCDATETIME()), 
        N'Store Incharge'
    FROM SpareParts;

    PRINT 'Seeded baseline INWARD transactions for SpareParts.';
END
GO

-- 3. Seed initial OUTWARD history from existing PartsUsed
IF NOT EXISTS (SELECT 1 FROM SparePartTransactions WHERE TransactionType = 'OUTWARD')
BEGIN
    INSERT INTO SparePartTransactions (PartId, TransactionType, Quantity, UnitPrice, ReferenceNo, SupplierOrSource, Remarks, MachineId, MechanicId, TransactionDate, CreatedBy)
    SELECT 
        pu.PartId,
        'OUTWARD',
        pu.Quantity,
        sp.UnitPrice,
        bt.TicketNumber,
        CONCAT('Shop Floor - ', m.MachineCode),
        ISNULL(pu.Remarks, N'Issued for breakdown replacement'),
        bt.MachineId,
        ma.MechanicId,
        ISNULL(ma.CompletedAt, ma.CreatedAt),
        N'Maintenance Workbench'
    FROM PartsUsed pu
    JOIN SpareParts sp ON pu.PartId = sp.PartId
    JOIN MaintenanceActions ma ON pu.ActionId = ma.ActionId
    JOIN BreakdownTickets bt ON ma.TicketId = bt.TicketId
    JOIN Machines m ON bt.MachineId = m.MachineId;

    PRINT 'Seeded baseline OUTWARD transactions from PartsUsed.';
END
GO
