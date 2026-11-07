USE MBMS_Production;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Update Employee Master with Indian Factory Names & Contact Numbers
UPDATE Employees SET EmployeeName = N'Rajesh Sharma', MobileNumber = N'+91 98201 12345', Designation = N'Plant IT & Engineering Lead' WHERE EmployeeCode = 'EMP-ADMIN';
UPDATE Employees SET EmployeeName = N'Manoj Kumar', MobileNumber = N'+91 98220 23456', Designation = N'Maintenance Incharge (HOD)' WHERE EmployeeCode = 'EMP-INC-01';
UPDATE Employees SET EmployeeName = N'Amit Verma', MobileNumber = N'+91 98230 34567', Designation = N'Senior Shift Supervisor (Assembly)' WHERE EmployeeCode = 'EMP-SUP-01';
UPDATE Employees SET EmployeeName = N'Suresh Patel', MobileNumber = N'+91 98240 45678', Designation = N'Machining Shop Supervisor' WHERE EmployeeCode = 'EMP-SUP-02';
UPDATE Employees SET EmployeeName = N'Vikram Joshi', MobileNumber = N'+91 98230 45679', Designation = N'Stamping Press Shop Supervisor' WHERE EmployeeCode = 'EMP-SUP-03';

UPDATE Employees SET EmployeeName = N'Ramesh Yadav', MobileNumber = N'+91 98250 56701', Designation = N'Electrical & Drives Fitter' WHERE EmployeeCode = 'EMP-MCH-01';
UPDATE Employees SET EmployeeName = N'Santosh Kumar', MobileNumber = N'+91 98250 56702', Designation = N'Hydraulic & Pneumatic Fitter' WHERE EmployeeCode = 'EMP-MCH-02';
UPDATE Employees SET EmployeeName = N'Vikram Singh', MobileNumber = N'+91 98250 56703', Designation = N'Mechanical Maintenance Fitter' WHERE EmployeeCode = 'EMP-MCH-03';
UPDATE Employees SET EmployeeName = N'Dinesh Verma', MobileNumber = N'+91 98250 56704', Designation = N'Automation & PLC Technician' WHERE EmployeeCode = 'EMP-MCH-04';
UPDATE Employees SET EmployeeName = N'Sachin Patil', MobileNumber = N'+91 98250 56705', Designation = N'Bearing & Vibration Specialist' WHERE EmployeeCode = 'EMP-MCH-05';
UPDATE Employees SET EmployeeName = N'Anil Vishwakarma', MobileNumber = N'+91 98250 56706', Designation = N'CNC Spindle & Tooling Fitter' WHERE EmployeeCode = 'EMP-MCH-06';
UPDATE Employees SET EmployeeName = N'Mukesh Maurya', MobileNumber = N'+91 98250 56707', Designation = N'Preventive Maintenance Technician' WHERE EmployeeCode = 'EMP-MCH-07';
UPDATE Employees SET EmployeeName = N'Sunil Jha', MobileNumber = N'+91 98250 56708', Designation = N'Pneumatics & Valve Technician' WHERE EmployeeCode = 'EMP-MCH-08';
UPDATE Employees SET EmployeeName = N'Pradeep Chauhan', MobileNumber = N'+91 98250 56709', Designation = N'Heavy Press Shop Fitter' WHERE EmployeeCode = 'EMP-MCH-09';
UPDATE Employees SET EmployeeName = N'Pankaj Tiwari', MobileNumber = N'+91 98250 56710', Designation = N'General Maintenance Fitter' WHERE EmployeeCode = 'EMP-MCH-10';

-- 2. Update System Configuration
UPDATE SystemSettings SET SettingValue = N'Asiaan Metals & Aluminium Casting Pvt Ltd' WHERE SettingKey = 'CompanyName';
UPDATE SystemSettings SET SettingValue = N'Unit 5 (U5)' WHERE SettingKey = 'FacilityName';

-- 3. Verify Changes
SELECT EmployeeId, EmployeeCode, EmployeeName, MobileNumber, Designation FROM Employees;
SELECT SettingKey, SettingValue FROM SystemSettings;
GO
