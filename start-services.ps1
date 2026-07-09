Get-ChildItem Env: | Where-Object { $_.Name -like 'SAFE_RM*' } | ForEach-Object { Remove-Item Env:$($_.Name) }
docker compose up -d