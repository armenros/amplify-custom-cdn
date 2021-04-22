aws sso login --profile dev
npx cdk-sso-sync dev
npm run cdk deploy LandingPageStack-dev -- --profile dev

created sso profile for cicd account
logged into that profile
ran cdk-sso-sync profilename

cdk bootstrap in the cicd account (newstylesynthesis)
deploy new codebase

cdk bootstrap --profile stelth-admin-sso-cicd
cdk deploy --profile stelth-admin-sso-cicd

Installing git-remote-codecommit

pip install git-remote-codecommit

git config --global credential.helper '!aws --profile stelth-admin-sso-cicd codecommit credential-helper $@'

<https://docs.aws.amazon.com/codecommit/latest/userguide/setting-up-https-unixes.html>

aws configure sso --profile stelth-admin-sso-cicd && aws sso login --profile stelth-admin-sso-cicd && npx cdk-sso-sync stelth-admin-sso-cicd


/amplify/backend/backend-config.json

get project IDS for all

grep -rl 'SearchString' ./ | xargs sed -i 's/REPLACESTRING/WITHTHIS/g'

get dev ID
get current branch app's ID

check which files have changed --> copy them to a tmp folder
recursively look through all changed files except aws-exports
search & replace id of previous with ID of current

try pushing?
