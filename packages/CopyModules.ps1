Set-Location "C:\Users\sgollapudi\Documents\Work\LinuxGithubAction\pipelines-appservice-lib\packages\appservice-rest"
echo "Current Directory: $PWD"
npm run build
Copy-Item -Path "C:\Users\sgollapudi\Documents\Work\LinuxGithubAction\pipelines-appservice-lib\packages\appservice-rest\lib\*" -Destination "C:\Users\sgollapudi\Documents\Work\LinuxGithubAction\webapps-deploy\node_modules\azure-actions-appservice-rest\" -Recurse -Force

# Set-Location "C:\Users\sgollapudi\Documents\Work\LinuxGithubAction\webapps-deploy"
