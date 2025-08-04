USE [HRManagementBD]
GO
/****** Object:  StoredProcedure [dbo].[GenerateMonthlySalaryReports]    Script Date: 8/4/2025 4:43:37 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Create a stored procedure to generate salary reports for all employees
ALTER   PROCEDURE [dbo].[GenerateMonthlySalaryReports]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Variables for current month/year and employee processing
    DECLARE @CurrentMonth INT = MONTH(GETDATE());
    DECLARE @CurrentYear INT = YEAR(GETDATE());
    DECLARE @PreviousMonth INT;
    DECLARE @PreviousYear INT;
    
    -- Calculate previous month and year
    IF @CurrentMonth = 1
    BEGIN
        SET @PreviousMonth = 12;
        SET @PreviousYear = @CurrentYear - 1;
    END
    ELSE
    BEGIN
        SET @PreviousMonth = @CurrentMonth - 1 ;
        SET @PreviousYear = @CurrentYear;
    END
    
    -- Variables for salary calculations
    DECLARE @WorkingDays INT;
	DECLARE @OfficialHolidaysCnt INT;
    DECLARE @HourlyRate DECIMAL(18,2);
    DECLARE @DailyRate DECIMAL(18,2);
    DECLARE @EmployeeSalary DECIMAL(18,2);
    DECLARE @EmployeeOverTime DECIMAL(18,2);
    DECLARE @EmployeeDelayTime DECIMAL(18,2);
    DECLARE @EmployeeAttendance INT;
    DECLARE @EmployeeId INT;
	Declare @Yearr int;
	Declare @OverTimeAmount int;
	Declare @DelayTimeAmount int;
	Declare @SecondHoliday varchar(10);
    DECLARE @WorkStartTime TIME(7) ;
	DECLARE @WorkEndTime   TIME(7) ;
	DECLARE @Employeeworkinghours int;
	DECLARE @HoursRate varchar(10);
	DEClARE @BonusValue int;
	DEClARE @DeductionValue int;

    -- Cursor to process all employees
    DECLARE employee_cursor CURSOR FOR
    SELECT EmployeeId FROM Employees --WHERE IsActive = 1; -- Assuming there's an IsActive column
    WHERE EmployeeId <> 10
    -- Calculate working days for the previous month
	SELECT @SecondHoliday = Weekend2 from SystemSettings ;
	IF @SecondHoliday IS NULL
    SET @WorkingDays = 30;
ELSE
    SET @WorkingDays = 22;
     SELECT @HoursRate = hoursrate from SystemSettings
	SELECT @OfficialHolidaysCnt = dbo.GetMonthOfficialHolidays(@CurrentYear, @CurrentMonth)
    OPEN employee_cursor;
    FETCH NEXT FROM employee_cursor INTO @EmployeeId;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        -- Reset variables for each employee
		SELECT @BonusValue = bonusvalue from SystemSettings where id = 11;
		SELECT @DeductionValue = deductionvalue from SystemSettings where id = 11;
        SET @EmployeeSalary = 0;
        SET @EmployeeOverTime = 0;
        SET @EmployeeDelayTime = 0;
        SET @EmployeeAttendance = 0;
        SET @OverTimeAmount = 0 ;
        SET @DelayTimeAmount = 0 ;
DECLARE @MonthStart DATE = DATEFROMPARTS(@PreviousYear, @PreviousMonth, 1);
DECLARE @MonthEnd DATE = EOMONTH(@MonthStart);
DECLARE @LeaveRequestCNT INT = 0;
SELECT @LeaveRequestCNT = ISNULL(SUM(
        CASE 
            WHEN lr.StartDate > @MonthEnd OR lr.EndDate < @MonthStart THEN 0
            ELSE 
                DATEDIFF(DAY, 
                    CASE WHEN lr.StartDate >= @MonthStart THEN lr.StartDate ELSE @MonthStart END,
                    CASE WHEN lr.EndDate <= @MonthEnd THEN lr.EndDate ELSE @MonthEnd END
                ) + 1
        END
    ),0)
FROM LeaveRequests lr
WHERE 
    lr.StartDate <= @MonthEnd 
    AND lr.EndDate >= @MonthStart
	AND Status = 'approved'	
	AND lr.EmployeeId = @EmployeeId
	AND lr.LeaveTypeId <>3;


		SELECT @WorkStartTime = WorkStartTime FROM Employees where employeeId = @EmployeeId;
		SELECT @WorkEndTime = WorkEndTime FROM Employees where employeeId = @EmployeeId;

		SELECT @Employeeworkinghours =  DATEDIFF(SECOND, @WorkStartTime, @WorkEndTime) / 3600.0 ;

		select @Yearr = @PreviousYear
        -- Get employee salary
        SELECT @EmployeeSalary = salary 
        FROM Employees 
        WHERE EmployeeId = @EmployeeId;

        -- Calculate daily and hourly rates
        SELECT @DailyRate = @EmployeeSalary / @WorkingDays; -- 22 OR 30 
        SELECT @HourlyRate = @DailyRate / @Employeeworkinghours ; 
        
        -- Get overtime hours for previous month
        SELECT @EmployeeOverTime = ISNULL(SUM(OvertimeHours), 0) 
        FROM Attendances 
        WHERE EmployeeId = @EmployeeId 
          AND MONTH(AttendanceDate) = @PreviousMonth 
          AND YEAR(AttendanceDate) = @PreviousYear;
        
        -- Get delay hours for previous month
        SELECT @EmployeeDelayTime = ISNULL(SUM(DelayHours), 0) 
        FROM Attendances 
        WHERE EmployeeId = @EmployeeId 
          AND MONTH(AttendanceDate) = @PreviousMonth 
          AND YEAR(AttendanceDate) = @PreviousYear;




		IF @HoursRate = 'Money'
BEGIN
    SET @OverTimeAmount = @EmployeeOverTime * @BonusValue;
    SET @DelayTimeAmount = @EmployeeDelayTime * @BonusValue;
END
ELSE
BEGIN
    SET @OverTimeAmount = @EmployeeOverTime * @BonusValue * @HourlyRate;
    SET @DelayTimeAmount = @EmployeeDelayTime * @BonusValue * @HourlyRate;
END

		

        -- Get attendance count for previous month
        SELECT @EmployeeAttendance = COUNT(*) 
        FROM Attendances 
        WHERE EmployeeId = @EmployeeId 
          AND MONTH(AttendanceDate) = @PreviousMonth 
          AND YEAR(AttendanceDate) = @PreviousYear;
        
         -- Check if report already exists for this employee and month
        IF NOT EXISTS (
            SELECT 1 FROM SalaryReports 
            WHERE EmployeeId = @EmployeeId 
              AND Month = @PreviousMonth 
              AND Year = @Yearr
        )
        BEGIN
            -- Insert salary report
            INSERT INTO SalaryReports 
            VALUES (
                @EmployeeId,
                @PreviousMonth,
                @EmployeeSalary,
                @OverTimeAmount ,
                @DelayTimeAmount ,
                ( (@EmployeeAttendance + @OfficialHolidaysCnt +@LeaveRequestCNT)  * @DailyRate) + (@OverTimeAmount ) - (@DelayTimeAmount ),
                GETDATE(),
                GETDATE(),
				@Yearr
            );
        END
		ELSE
		BEGIN
		 UPDATE SalaryReports 
            SET 
                BasicSalary = @EmployeeSalary,
                OvertimeAmount = @OverTimeAmount ,
                DeductionAmount = @DelayTimeAmount ,
                NetSalary = ((@EmployeeAttendance + @OfficialHolidaysCnt+@LeaveRequestCNT) * @DailyRate) + (@OverTimeAmount ) - ( @DelayTimeAmount),
                GeneratedAt = GETDATE(),  -- Only update the "last modified" timestamp,
				Year = @Yearr
            WHERE EmployeeId = @EmployeeId 
              AND Month = @PreviousMonth  
              AND Year = @Yearr
		END


		

        FETCH NEXT FROM employee_cursor INTO @EmployeeId;
    END
    
    CLOSE employee_cursor;
    DEALLOCATE employee_cursor;
END;
