using MBMS.Application.Interfaces;
using MBMS.Domain.Entities;
using MBMS.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MBMS.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(MBMSDbContext db, IPasswordHasher hasher, IQRService qrService)
    {
        // 1. Ensure basic roles exist
        var adminRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == DomainConstants.RoleAdmin);
        if (adminRole == null)
        {
            adminRole = new Role { RoleName = DomainConstants.RoleAdmin, Description = "Full Administrator" };
            db.Roles.Add(adminRole);
        }

        var supervisorRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == DomainConstants.RoleSupervisor);
        if (supervisorRole == null)
        {
            supervisorRole = new Role { RoleName = DomainConstants.RoleSupervisor, Description = "Production Supervisor" };
            db.Roles.Add(supervisorRole);
        }

        var inchargeRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == DomainConstants.RoleMaintenanceIncharge);
        if (inchargeRole == null)
        {
            inchargeRole = new Role { RoleName = DomainConstants.RoleMaintenanceIncharge, Description = "Maintenance Incharge" };
            db.Roles.Add(inchargeRole);
        }

        var mechanicRole = await db.Roles.FirstOrDefaultAsync(r => r.RoleName == DomainConstants.RoleMechanic);
        if (mechanicRole == null)
        {
            mechanicRole = new Role { RoleName = DomainConstants.RoleMechanic, Description = "Maintenance Technician" };
            db.Roles.Add(mechanicRole);
        }

        await db.SaveChangesAsync();

        // 2. Ensure Departments exist
        var prodDept = await db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "DEPT-PROD");
        if (prodDept == null)
        {
            prodDept = new Department { DepartmentCode = "DEPT-PROD", DepartmentName = "Production & Assembly" };
            db.Departments.Add(prodDept);
        }

        var maintDept = await db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "DEPT-MAINT");
        if (maintDept == null)
        {
            maintDept = new Department { DepartmentCode = "DEPT-MAINT", DepartmentName = "Plant Maintenance & Engineering" };
            db.Departments.Add(maintDept);
        }

        var machDept = await db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "DEPT-MACH");
        if (machDept == null)
        {
            machDept = new Department { DepartmentCode = "DEPT-MACH", DepartmentName = "Machining & CNC Shop" };
            db.Departments.Add(machDept);
        }

        var stampDept = await db.Departments.FirstOrDefaultAsync(d => d.DepartmentCode == "DEPT-STAMP");
        if (stampDept == null)
        {
            stampDept = new Department { DepartmentCode = "DEPT-STAMP", DepartmentName = "Press & Stamping Shop" };
            db.Departments.Add(stampDept);
        }

        await db.SaveChangesAsync();

        // 3. Ensure Sections exist
        if (!await db.ProductionSections.AnyAsync())
        {
            db.ProductionSections.AddRange(
                new ProductionSection { DepartmentId = prodDept.DepartmentId, SectionCode = "SEC-LINE1", SectionName = "Main Assembly Line 1" },
                new ProductionSection { DepartmentId = prodDept.DepartmentId, SectionCode = "SEC-LINE2", SectionName = "Sub-Assembly Line 2" },
                new ProductionSection { DepartmentId = machDept.DepartmentId, SectionCode = "SEC-CNC1", SectionName = "CNC Milling Bay" },
                new ProductionSection { DepartmentId = stampDept.DepartmentId, SectionCode = "SEC-PRS1", SectionName = "Heavy Press Bay" }
            );
            await db.SaveChangesAsync();
        }

        // 4. Ensure Breakdown Categories exist
        if (!await db.BreakdownCategories.AnyAsync())
        {
            db.BreakdownCategories.AddRange(
                new BreakdownCategory { CategoryName = "Electrical", Description = "Power, breakers, drives, wiring" },
                new BreakdownCategory { CategoryName = "Mechanical", Description = "Gears, shafts, bearings, couplings" },
                new BreakdownCategory { CategoryName = "Hydraulic", Description = "Pumps, valves, hoses, cylinders" },
                new BreakdownCategory { CategoryName = "Pneumatic", Description = "Air lines, solenoid valves, cylinders" },
                new BreakdownCategory { CategoryName = "Automation & PLC", Description = "PLCs, sensors, communication buses" },
                new BreakdownCategory { CategoryName = "Motor Failure", Description = "Overheating, winding burn, insulation" },
                new BreakdownCategory { CategoryName = "Sensor Failure", Description = "Proximity, photo-eye, encoder" },
                new BreakdownCategory { CategoryName = "Other", Description = "Miscellaneous failure" }
            );
            await db.SaveChangesAsync();
        }

        // 5. Ensure SLA Configurations exist
        if (!await db.SLAConfigurations.AnyAsync())
        {
            db.SLAConfigurations.AddRange(
                new SLAConfiguration { Priority = "CRITICAL", ResponseTargetMinutes = 5, ResolutionTargetMinutes = 120 },
                new SLAConfiguration { Priority = "HIGH", ResponseTargetMinutes = 15, ResolutionTargetMinutes = 240 },
                new SLAConfiguration { Priority = "MEDIUM", ResponseTargetMinutes = 30, ResolutionTargetMinutes = 480 },
                new SLAConfiguration { Priority = "LOW", ResponseTargetMinutes = 60, ResolutionTargetMinutes = 1440 }
            );
            await db.SaveChangesAsync();
        }

        // 6. Ensure Spare Parts exist
        if (!await db.SpareParts.AnyAsync())
        {
            db.SpareParts.AddRange(
                new SparePart { PartCode = "PART-BRG-6205", PartName = "Ball Bearing 6205-2RS", Unit = "NOS", UnitPrice = 450, StockQuantity = 50 },
                new SparePart { PartCode = "PART-BRG-6308", PartName = "Roller Bearing 6308", Unit = "NOS", UnitPrice = 980, StockQuantity = 25 },
                new SparePart { PartCode = "PART-HYD-SEAL-80", PartName = "Hydraulic Piston Seal 80mm", Unit = "SET", UnitPrice = 1250, StockQuantity = 15 },
                new SparePart { PartCode = "PART-VALV-SOL-24V", PartName = "Pneumatic Solenoid Valve 5/2 24VDC", Unit = "NOS", UnitPrice = 2800, StockQuantity = 10 },
                new SparePart { PartCode = "PART-FUSE-32A", PartName = "HRC Fuse 32A", Unit = "NOS", UnitPrice = 180, StockQuantity = 100 },
                new SparePart { PartCode = "PART-OIL-VG68", PartName = "Hydraulic Oil ISO VG 68", Unit = "LITERS", UnitPrice = 220, StockQuantity = 500 }
            );
            await db.SaveChangesAsync();
        }

        // 7. Seed Admin User
        var adminEmp = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-ADMIN");
        if (adminEmp == null)
        {
            adminEmp = new Employee
            {
                EmployeeCode = "EMP-ADMIN",
                EmployeeName = "Rajesh Sharma",
                DepartmentId = maintDept.DepartmentId,
                Designation = "Plant IT & Engineering Lead",
                MobileNumber = "+91 98201 12345",
                Email = "rajesh.sharma@factory.lan"
            };
            db.Employees.Add(adminEmp);
            await db.SaveChangesAsync();

            var adminUser = new User
            {
                EmployeeId = adminEmp.EmployeeId,
                Username = "admin",
                PasswordHash = hasher.HashPassword("Admin@123"),
                IsActive = true
            };
            db.Users.Add(adminUser);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = adminUser.UserId, RoleId = adminRole.RoleId });
            await db.SaveChangesAsync();
        }

        // 8. Seed Maintenance Incharge
        var inchargeEmp = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-INC-01");
        if (inchargeEmp == null)
        {
            inchargeEmp = new Employee
            {
                EmployeeCode = "EMP-INC-01",
                EmployeeName = "Manoj Kumar",
                DepartmentId = maintDept.DepartmentId,
                Designation = "Maintenance Incharge (HOD)",
                MobileNumber = "+91 98220 23456",
                Email = "manoj.kumar@factory.lan"
            };
            db.Employees.Add(inchargeEmp);
            await db.SaveChangesAsync();

            var inchargeUser = new User
            {
                EmployeeId = inchargeEmp.EmployeeId,
                Username = "incharge1",
                PasswordHash = hasher.HashPassword("Incharge@123"),
                IsActive = true
            };
            db.Users.Add(inchargeUser);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = inchargeUser.UserId, RoleId = inchargeRole.RoleId });
            await db.SaveChangesAsync();
        }

        // 9. Seed Supervisors
        var sectionLine1 = await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-LINE1");
        var sectionLine2 = await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-LINE2");
        var sectionCnc = await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-CNC1");
        var sectionPrs = await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-PRS1" || s.SectionCode == "SEC-PRESS1");
        var sectionUtil = await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-UTIL1");

        var sup1Emp = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-SUP-01");
        if (sup1Emp == null)
        {
            sup1Emp = new Employee
            {
                EmployeeCode = "EMP-SUP-01",
                EmployeeName = "Amit Verma",
                DepartmentId = prodDept.DepartmentId,
                SectionId = sectionLine1?.SectionId,
                Designation = "Senior Shift Supervisor (Assembly)",
                MobileNumber = "+91 98230 34567",
                Email = "amit.verma@factory.lan"
            };
            db.Employees.Add(sup1Emp);
            await db.SaveChangesAsync();

            var sup1User = new User
            {
                EmployeeId = sup1Emp.EmployeeId,
                Username = "supervisor1",
                PasswordHash = hasher.HashPassword("Supervisor@123"),
                IsActive = true
            };
            db.Users.Add(sup1User);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = sup1User.UserId, RoleId = supervisorRole.RoleId });
            await db.SaveChangesAsync();
        }

        var sup2Emp = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-SUP-02");
        if (sup2Emp == null)
        {
            sup2Emp = new Employee
            {
                EmployeeCode = "EMP-SUP-02",
                EmployeeName = "Suresh Patel",
                DepartmentId = machDept.DepartmentId,
                SectionId = sectionCnc?.SectionId,
                Designation = "Machining Shop Supervisor",
                MobileNumber = "+91 98240 45678",
                Email = "suresh.patel@factory.lan"
            };
            db.Employees.Add(sup2Emp);
            await db.SaveChangesAsync();

            var sup2User = new User
            {
                EmployeeId = sup2Emp.EmployeeId,
                Username = "supervisor2",
                PasswordHash = hasher.HashPassword("Supervisor@123"),
                IsActive = true
            };
            db.Users.Add(sup2User);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = sup2User.UserId, RoleId = supervisorRole.RoleId });
            await db.SaveChangesAsync();
        }

        var sup3Emp = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == "EMP-SUP-03");
        if (sup3Emp == null)
        {
            sup3Emp = new Employee
            {
                EmployeeCode = "EMP-SUP-03",
                EmployeeName = "Vikram Joshi",
                DepartmentId = stampDept.DepartmentId,
                SectionId = sectionPrs?.SectionId,
                Designation = "Stamping Press Shop Supervisor",
                MobileNumber = "+91 98230 45679",
                Email = "vikram.joshi@factory.lan"
            };
            db.Employees.Add(sup3Emp);
            await db.SaveChangesAsync();

            var sup3User = new User
            {
                EmployeeId = sup3Emp.EmployeeId,
                Username = "supervisor3",
                PasswordHash = hasher.HashPassword("Supervisor@123"),
                IsActive = true
            };
            db.Users.Add(sup3User);
            await db.SaveChangesAsync();

            db.UserRoles.Add(new UserRole { UserId = sup3User.UserId, RoleId = supervisorRole.RoleId });
            await db.SaveChangesAsync();
        }

        // 10. Seed Mechanics (10 Mechanics)
        var mechanicSpecs = new[]
        {
            ("Ramesh Yadav", "Electrical & AC Drives Specialist", "Morning Shift (A)", sectionCnc?.SectionId),
            ("Santosh Kumar", "Hydraulics & High Pressure Systems", "Morning Shift (A)", sectionPrs?.SectionId),
            ("Vikram Singh", "Mechanical Fitter & Transmission", "General Shift (G)", sectionLine1?.SectionId),
            ("Dinesh Verma", "Automation, PLC & Sensors", "General Shift (G)", sectionLine2?.SectionId),
            ("Sachin Patil", "Bearing & Vibration Analysis", "General Shift (G)", sectionUtil?.SectionId),
            ("Anil Vishwakarma", "CNC Spindle & Tooling Fitter", "Evening Shift (B)", sectionCnc?.SectionId),
            ("Mukesh Maurya", "Preventive Maintenance Lead", "Evening Shift (B)", sectionLine1?.SectionId),
            ("Sunil Jha", "Pneumatics & Control Valves", "Evening Shift (B)", sectionPrs?.SectionId),
            ("Pradeep Chauhan", "Heavy Stamping Press Specialist", "Night Shift (C)", sectionPrs?.SectionId),
            ("Pankaj Tiwari", "General Maintenance Fitter", "Night Shift (C)", (int?)null)
        };

        for (int i = 0; i < mechanicSpecs.Length; i++)
        {
            var code = $"EMP-MCH-{(i + 1):D2}";
            var username = $"mech{i + 1}";
            var (name, spec, shift, mechSecId) = mechanicSpecs[i];

            var mechEmp = await db.Employees.FirstOrDefaultAsync(e => e.EmployeeCode == code);
            if (mechEmp == null)
            {
                mechEmp = new Employee
                {
                    EmployeeCode = code,
                    EmployeeName = name,
                    DepartmentId = maintDept.DepartmentId,
                    SectionId = mechSecId,
                    Designation = "Maintenance Technician",
                    MobileNumber = $"98765433{(i + 1):D2}",
                    Email = $"{username}@factory.lan"
                };
                db.Employees.Add(mechEmp);
                await db.SaveChangesAsync();

                var mechUser = new User
                {
                    EmployeeId = mechEmp.EmployeeId,
                    Username = username,
                    PasswordHash = hasher.HashPassword("Mechanic@123"),
                    IsActive = true
                };
                db.Users.Add(mechUser);
                await db.SaveChangesAsync();

                db.UserRoles.Add(new UserRole { UserId = mechUser.UserId, RoleId = mechanicRole.RoleId });

                var mech = new Mechanic
                {
                    EmployeeId = mechEmp.EmployeeId,
                    SectionId = mechSecId,
                    Specialization = spec,
                    ShiftName = shift,
                    IsAvailable = true,
                    ActiveTicketCount = 0
                };
                db.Mechanics.Add(mech);
                await db.SaveChangesAsync();
            }
        }

        // 11. Seed Machines
        if (!await db.Machines.AnyAsync())
        {
            sectionLine1 ??= await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-LINE1");
            sectionCnc ??= await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-CNC1");
            sectionPrs ??= await db.ProductionSections.FirstOrDefaultAsync(s => s.SectionCode == "SEC-PRS1");

            var machinesList = new List<Machine>
            {
                new() { MachineCode = "MCH-CNC-001", MachineName = "5-Axis CNC Milling Center - Haas VF4", DepartmentId = machDept.DepartmentId, SectionId = sectionCnc?.SectionId, MachineCategory = "CNC Machine", Location = "Bay C-1", Manufacturer = "Haas Automation", ModelNumber = "VF-4SS", SerialNumber = "HAAS-94812", InstallationDate = new DateTime(2021, 3, 15), Criticality = "CRITICAL" },
                new() { MachineCode = "MCH-CNC-002", MachineName = "CNC Turning Lathe - Mazak QT250", DepartmentId = machDept.DepartmentId, SectionId = sectionCnc?.SectionId, MachineCategory = "CNC Machine", Location = "Bay C-2", Manufacturer = "Yamazaki Mazak", ModelNumber = "QT-Primos 250", SerialNumber = "MZK-22104", InstallationDate = new DateTime(2022, 6, 10), Criticality = "HIGH" },
                new() { MachineCode = "MCH-PRS-001", MachineName = "500-Ton Hydraulic Stamping Press", DepartmentId = stampDept.DepartmentId, SectionId = sectionPrs?.SectionId, MachineCategory = "Hydraulic Press", Location = "Press Bay A", Manufacturer = "Schuler Group", ModelNumber = "HP-500D", SerialNumber = "SCH-88310", InstallationDate = new DateTime(2019, 11, 20), Criticality = "CRITICAL" },
                new() { MachineCode = "MCH-PRS-002", MachineName = "250-Ton Mechanical Press", DepartmentId = stampDept.DepartmentId, SectionId = sectionPrs?.SectionId, MachineCategory = "Hydraulic Press", Location = "Press Bay B", Manufacturer = "Aida Engineering", ModelNumber = "NC1-2500", SerialNumber = "AIDA-4412", InstallationDate = new DateTime(2020, 8, 12), Criticality = "HIGH" },
                new() { MachineCode = "MCH-ASY-001", MachineName = "Automated Conveyor Transfer System", DepartmentId = prodDept.DepartmentId, SectionId = sectionLine1?.SectionId, MachineCategory = "Conveyor System", Location = "Main Line 1 Head", Manufacturer = "Bosch Rexroth", ModelNumber = "TS-2plus", SerialNumber = "BR-77123", InstallationDate = new DateTime(2022, 1, 10), Criticality = "HIGH" },
                new() { MachineCode = "MCH-ASY-002", MachineName = "Robotic Pick & Place Cell", DepartmentId = prodDept.DepartmentId, SectionId = sectionLine1?.SectionId, MachineCategory = "Robotic Cell", Location = "Station 4", Manufacturer = "FANUC", ModelNumber = "M-20iD/25", SerialNumber = "FNC-99120", InstallationDate = new DateTime(2023, 4, 18), Criticality = "MEDIUM" },
                new() { MachineCode = "MCH-UTL-001", MachineName = "Rotary Screw Air Compressor 75kW", DepartmentId = maintDept.DepartmentId, Location = "Utility Room 1", Manufacturer = "Atlas Copco", ModelNumber = "GA 75 VSD+", SerialNumber = "AC-55102", InstallationDate = new DateTime(2018, 9, 5), Criticality = "CRITICAL" },
                new() { MachineCode = "MCH-INJ-001", MachineName = "Plastic Injection Molding 350T", DepartmentId = prodDept.DepartmentId, Location = "Molding Bay 2", Manufacturer = "Engel", ModelNumber = "victory 330/80", SerialNumber = "ENG-3199", InstallationDate = new DateTime(2021, 10, 30), Criticality = "HIGH" }
            };

            foreach (var m in machinesList)
            {
                db.Machines.Add(m);
            }
            await db.SaveChangesAsync();

            foreach (var m in machinesList)
            {
                m.QRCode = qrService.GenerateMachineQrPayload(m.MachineId, m.MachineCode);
            }
            await db.SaveChangesAsync();
        }

        // 12. Seed Sample Breakdown Incident Tickets (For immediate dashboard rendering)
        if (!await db.BreakdownTickets.AnyAsync())
        {
            var m1 = await db.Machines.FirstAsync(m => m.MachineCode == "MCH-CNC-001");
            var m2 = await db.Machines.FirstAsync(m => m.MachineCode == "MCH-PRS-001");
            var m3 = await db.Machines.FirstAsync(m => m.MachineCode == "MCH-ASY-001");

            var catElec = await db.BreakdownCategories.FirstAsync(c => c.CategoryName == "Electrical");
            var catHyd = await db.BreakdownCategories.FirstAsync(c => c.CategoryName == "Hydraulic");
            var catMech = await db.BreakdownCategories.FirstAsync(c => c.CategoryName == "Mechanical");

            var mech1 = await db.Mechanics.Include(m => m.Employee).FirstAsync(m => m.Employee!.EmployeeCode == "EMP-MCH-01");
            var mech2 = await db.Mechanics.Include(m => m.Employee).FirstAsync(m => m.Employee!.EmployeeCode == "EMP-MCH-02");

            var now = DateTime.UtcNow;

            // Sample Ticket 1: Fully Closed breakdown (Historical completed)
            var t1 = new BreakdownTicket
            {
                TicketNumber = $"BD-{now.Year}-00001",
                MachineId = m1.MachineId,
                SupervisorId = sup2Emp.EmployeeId,
                CategoryId = catElec.CategoryId,
                BreakdownOccurredAt = now.AddDays(-3).AddHours(-4),
                ReportedAt = now.AddDays(-3).AddHours(-3).AddMinutes(-50),
                BreakdownReason = "Spindle drive overload fault code E-04",
                BreakdownDescription = "Spindle motor stopped abruptly during high-feed finishing pass. Control panel threw continuous E-04 drive fault.",
                MachineCondition = "STOPPED",
                ProductionImpact = "CRITICAL",
                Priority = "CRITICAL",
                CurrentStatus = DomainConstants.StatusClosed,
                CurrentApprovalRound = 1,
                RepairCompletedAt = now.AddDays(-3).AddHours(-1),
                ProductionRestoredAt = now.AddDays(-3).AddMinutes(-30),
                ClosedAt = now.AddDays(-3).AddMinutes(-10),
                CreatedAt = now.AddDays(-3).AddHours(-3).AddMinutes(-50),
                UpdatedAt = now.AddDays(-3).AddMinutes(-10)
            };
            db.BreakdownTickets.Add(t1);
            await db.SaveChangesAsync();

            db.TicketAssignments.Add(new TicketAssignment
            {
                TicketId = t1.TicketId,
                MechanicId = mech1.MechanicId,
                AssignedBy = inchargeEmp.EmployeeId,
                AssignedAt = now.AddDays(-3).AddHours(-3).AddMinutes(-40),
                AcceptedAt = now.AddDays(-3).AddHours(-3).AddMinutes(-30),
                AssignmentRemarks = "Urgent: CNC line finishing bottleneck",
                IsCurrent = true
            });

            var act1 = new MaintenanceAction
            {
                TicketId = t1.TicketId,
                MechanicId = mech1.MechanicId,
                ApprovalRound = 1,
                InspectionFindings = "Cooling fan in Yaskawa spindle drive had failed, causing thermal runaway on IGBT power module.",
                ActualRootCause = "Drive heat sink fan seized due to fine aluminum dust accumulation over 6 months.",
                ActionTaken = "Replaced heat sink cooling fan unit, cleaned all air intake filters, reset thermal trip, tested spindle at 12000 RPM under load.",
                StartedAt = now.AddDays(-3).AddHours(-3).AddMinutes(-30),
                CompletedAt = now.AddDays(-3).AddHours(-1),
                MachineConditionAfterRepair = "RUNNING_NORMAL",
                MechanicRemarks = "Clean spindle heat sink quarterly.",
                CreatedAt = now.AddDays(-3).AddHours(-1)
            };
            db.MaintenanceActions.Add(act1);
            await db.SaveChangesAsync();

            db.TicketWorkSessions.Add(new TicketWorkSession
            {
                TicketId = t1.TicketId,
                ActionId = act1.ActionId,
                MechanicId = mech1.MechanicId,
                SessionType = "WORK",
                StartedAt = now.AddDays(-3).AddHours(-3).AddMinutes(-30),
                EndedAt = now.AddDays(-3).AddHours(-1),
                Notes = "Cleaned heat sink, replaced fan and tested drive"
            });

            db.TicketApprovals.AddRange(
                new TicketApproval
                {
                    TicketId = t1.TicketId,
                    ApprovalRound = 1,
                    ApprovalStage = DomainConstants.StageSupervisor,
                    ApproverId = sup2Emp.EmployeeId,
                    ApprovalStatus = DomainConstants.ApprovalStatusApproved,
                    Remarks = "Trial pass of 10 machined components verified OK with zero vibration.",
                    ApprovedAt = now.AddDays(-3).AddMinutes(-30),
                    CreatedAt = now.AddDays(-3).AddMinutes(-30)
                },
                new TicketApproval
                {
                    TicketId = t1.TicketId,
                    ApprovalRound = 1,
                    ApprovalStage = DomainConstants.StageIncharge,
                    ApproverId = inchargeEmp.EmployeeId,
                    ApprovalStatus = DomainConstants.ApprovalStatusApproved,
                    Remarks = "Root cause verified. Maintenance preventative schedule updated.",
                    ApprovedAt = now.AddDays(-3).AddMinutes(-10),
                    CreatedAt = now.AddDays(-3).AddMinutes(-10)
                }
            );

            db.MachineDowntime.Add(new MachineDowntime
            {
                TicketId = t1.TicketId,
                MachineId = m1.MachineId,
                StartedAt = t1.BreakdownOccurredAt,
                RestoredAt = t1.ProductionRestoredAt,
                RestorationRemarks = "Repair approved and closed."
            });

            // Sample Ticket 2: Awaiting Supervisor Verification
            var t2 = new BreakdownTicket
            {
                TicketNumber = $"BD-{now.Year}-00002",
                MachineId = m2.MachineId,
                SupervisorId = sup1Emp.EmployeeId,
                CategoryId = catHyd.CategoryId,
                BreakdownOccurredAt = now.AddHours(-2).AddMinutes(-30),
                ReportedAt = now.AddHours(-2).AddMinutes(-20),
                BreakdownReason = "Hydraulic pressure drop on ram downstroke",
                BreakdownDescription = "Ram descent stalled midway. Main gauge dropped from 220 bar to 60 bar with audible hissing.",
                MachineCondition = "PARTIALLY_WORKING",
                ProductionImpact = "HIGH",
                Priority = "HIGH",
                CurrentStatus = DomainConstants.StatusAwaitingSupervisor,
                CurrentApprovalRound = 1,
                RepairCompletedAt = now.AddMinutes(-20),
                CreatedAt = now.AddHours(-2).AddMinutes(-20),
                UpdatedAt = now.AddMinutes(-20)
            };
            db.BreakdownTickets.Add(t2);
            await db.SaveChangesAsync();

            db.TicketAssignments.Add(new TicketAssignment
            {
                TicketId = t2.TicketId,
                MechanicId = mech2.MechanicId,
                AssignedBy = inchargeEmp.EmployeeId,
                AssignedAt = now.AddHours(-2).AddMinutes(-15),
                AcceptedAt = now.AddHours(-2).AddMinutes(-10),
                AssignmentRemarks = "Check main relief valve and cylinder seal.",
                IsCurrent = true
            });

            var act2 = new MaintenanceAction
            {
                TicketId = t2.TicketId,
                MechanicId = mech2.MechanicId,
                ApprovalRound = 1,
                InspectionFindings = "High pressure proportional pilot relief valve spool was stuck open with foreign particle.",
                ActualRootCause = "Contamination in pilot line blocked spool return spring.",
                ActionTaken = "Dismantled pilot stage, flushed manifold block, cleaned spool seat, replaced pilot filter cartridge, calibrated holding pressure to 220 bar.",
                StartedAt = now.AddHours(-2).AddMinutes(-10),
                CompletedAt = now.AddMinutes(-20),
                MachineConditionAfterRepair = "RUNNING_NORMAL",
                MechanicRemarks = "Ready for supervisor verification and stamping trial.",
                CreatedAt = now.AddMinutes(-20)
            };
            db.MaintenanceActions.Add(act2);
            await db.SaveChangesAsync();

            db.TicketWorkSessions.Add(new TicketWorkSession
            {
                TicketId = t2.TicketId,
                ActionId = act2.ActionId,
                MechanicId = mech2.MechanicId,
                SessionType = "WORK",
                StartedAt = now.AddHours(-2).AddMinutes(-10),
                EndedAt = now.AddMinutes(-20),
                Notes = "Flushed pilot valve and recalibrated pressure"
            });

            db.MachineDowntime.Add(new MachineDowntime
            {
                TicketId = t2.TicketId,
                MachineId = m2.MachineId,
                StartedAt = t2.BreakdownOccurredAt,
                RestoredAt = null // Still open until restored and approved
            });

            // Sample Ticket 3: In Progress (Active work)
            var t3 = new BreakdownTicket
            {
                TicketNumber = $"BD-{now.Year}-00003",
                MachineId = m3.MachineId,
                SupervisorId = sup1Emp.EmployeeId,
                CategoryId = catMech.CategoryId,
                BreakdownOccurredAt = now.AddHours(-1),
                ReportedAt = now.AddMinutes(-50),
                BreakdownReason = "Conveyor drive motor high squealing and abnormal vibration",
                BreakdownDescription = "Drive head roller bearing running excessively hot (~85°C) with metallic grinding noise.",
                MachineCondition = "STOPPED",
                ProductionImpact = "HIGH",
                Priority = "MEDIUM",
                CurrentStatus = DomainConstants.StatusInProgress,
                CurrentApprovalRound = 1,
                CreatedAt = now.AddMinutes(-50),
                UpdatedAt = now.AddMinutes(-30)
            };
            db.BreakdownTickets.Add(t3);
            await db.SaveChangesAsync();

            db.TicketAssignments.Add(new TicketAssignment
            {
                TicketId = t3.TicketId,
                MechanicId = mech1.MechanicId,
                AssignedBy = inchargeEmp.EmployeeId,
                AssignedAt = now.AddMinutes(-45),
                AcceptedAt = now.AddMinutes(-40),
                AssignmentRemarks = "Inspect head pulley pillow block bearings",
                IsCurrent = true
            });

            db.TicketWorkSessions.Add(new TicketWorkSession
            {
                TicketId = t3.TicketId,
                MechanicId = mech1.MechanicId,
                SessionType = "WORK",
                StartedAt = now.AddMinutes(-35),
                Notes = "Dismantling conveyor chain guard to pull pillow block bearing."
            });

            db.MachineDowntime.Add(new MachineDowntime
            {
                TicketId = t3.TicketId,
                MachineId = m3.MachineId,
                StartedAt = t3.BreakdownOccurredAt,
                RestoredAt = null
            });

            await db.SaveChangesAsync();
        }
    }
}