$ws = New-Object -ComObject WScript.Shell
$s = $ws.CreateShortcut('C:\Users\AMAC-U1\Desktop\AMAC Maintenance Application.lnk')
$s.TargetPath = 'c:\Users\AMAC-U1\Desktop\Maintenace Application\start.bat'
$s.WorkingDirectory = 'c:\Users\AMAC-U1\Desktop\Maintenace Application'
$s.IconLocation = 'c:\Users\AMAC-U1\Desktop\Maintenace Application\frontend\public\favicon.ico'
$s.Description = 'AMAC Machine Breakdown and Maintenance Management System'
$s.Save()
Write-Host "Shortcut created successfully."

