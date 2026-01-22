$lines = Get-Content 'e:\桌面\love-app\src\index.tsx'
$newLines = @($lines[0..2045]) + @($lines[2244..$($lines.Count-1)])
$newLines | Set-Content 'e:\桌面\love-app\src\index.tsx' -Encoding UTF8
Write-Host "Deleted MoodView function"
