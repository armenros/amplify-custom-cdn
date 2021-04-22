

### profiles to use

- CICD Acct. Admin Privs: cicd-admin
- CICD Acct. DevOps Privs: cicd-devops

- MASTER ACCOUNT ROOT ADMIN: rootbuilder

OLD REPO REMOTE:
origin codecommit::us-west-2://stelth-arubani (fetch)
origin codecommit::us-west-2://stelth-arubani (push)

aws sso login --profile cicd-admin && npx cdk-sso-sync cicd-admin

npm run cdk deploy WebAppPipelineStack -- --profile cicd-admin
