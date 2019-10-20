# e:\Beta\js\vscode\node10\msbuild-env.ps1

# msbuild build/binding.sln /clp:Verbosity=minimal /nologo /p:Configuration=Release;Platform=x64

$env:PATH="E:\Microsoft Visual Studio\2019\Preview\MSBuild\Current\Bin\;" + $env:PATH

cd c:\Program Files (x86)\Microsoft Visual Studio\2019\Preview\
sudo cmd /c 'mklink /D MSBuild "E:\Microsoft Visual Studio\2019\Preview\MSBuild"'

# c:\bin;C:\Program Files\dotnet;c:\Program Files\Yarn\bin;c:\Program Files\nodejs;C:\Python37\Scripts\;C:\Python37\;c:\Program Files (x86)\Microsoft Visual Studio\2017\Community\MSBuild\15.0\Bin;C:\WINDOWS\system32;C:\WINDOWS;C:\WINDOWS\System32\Wbem;C:\WINDOWS\System32\WindowsPowerShell\v1.0\;C:\WINDOWS\System32\OpenSSH\;C:\ProgramData\chocolatey\bin;C:\Program Files\Microsoft SQL Server\130\Tools\Binn\;C:\Program Files (x86)\Microsoft SQL Server\Client SDK\ODBC\130\Tools\Binn\;C:\Program Files (x86)\Microsoft SQL Server\140\Tools\Binn\;C:\Program Files (x86)\Microsoft SQL Server\140\DTS\Binn\;C:\Program Files (x86)\Microsoft SQL Server\140\Tools\Binn\ManagementStudio\;c:\Python27;C:\Program Files\dotnet\;c:\Program Files\PowerShell\6\;C:\Program Files\Microsoft SQL Server\Client SDK\ODBC\170\Tools\Binn\;C:\Program Files\Git\cmd;C:\Program Files\nodejs\;C:\Program Files (x86)\GtkSharp\2.12\bin;c:\Program Files\Microsoft SQL Server\140\Tools\Binn\;C:\Program Files (x86)\dotnet\;C:\Program Files (x86)\Yarn\bin\;c:\Program Files\dotnet;C:\Users\akris\AppData\Local\Microsoft\WindowsApps;C:\Users\akris\AppData\Local\Programs\Microsoft VS Code\bin;C:\Users\akris\.dotnet\tools;
c:\Program Files (x86)\Microsoft Visual Studio\2019\Preview\MSBuild\Current\Bin;
# C:\Users\akris\AppData\Local\Microsoft\WindowsApps;C:\Users\akris\AppData\Roaming\npm;C:\Users\akris\AppData\Local\Yarn\bin

