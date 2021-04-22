#!/bin/bash
set -e

# Get the current branch name

current_branch_name=$(git branch | grep "*" | sed "s/\* //")
project_root_dir=$(git rev-parse --show-toplevel)
root_branches=("development" "dev" "staging" "qa" "production" "prod" "main" "master")
root_branches_no_main=("development" "dev" "staging" "qa" "production" "prod")

# Get the name of the branch & branch prefix that was just merged
reflog_message=$(git reflog -1)
short_commit_hash=$(git rev-parse --short HEAD)
merged_branch_name=$(echo "$reflog_message" | cut -d" " -f 4 | sed "s/://")
merged_branch_prefix=$(echo "$merged_branch_name" | cut -d- -f1)

echo "MERGED BRANCH IS: $merged_branch_name"

# if the merged branch was master
if [[ $merged_branch_name = "main" || $merged_branch_name = "Fast-forward" ]]; then
  echo "I WILL COPY FILES NOW!"
  mv amplify amplify.bak &&
    cp -pRP "$project_root_dir"/amplify."$current_branch_name" "$project_root_dir"/amplify
  echo "UPDATED env Amplify files with those from main!"
  exit
fi

# Begin output
echo -e "[NOTIFY]\n You've just merged the branch \"$merged_branch_name\" into \"$current_branch_name\". "

if [[ -e "$project_root_dir"/amplify ]]; then
  echo -e "[ALERT]\n Looks like you've merged an amplify folder from branch prefix $merged_branch_prefix!"
  echo -e "[ACTION]\n Moving amplify folder from branch $merged_branch_prefix to its appropriate environment folder: amplify.$merged_branch_prefix!"

  rm -rf "$project_root_dir"/amplify."$merged_branch_prefix"
  cp -pRP "$project_root_dir"/amplify "$project_root_dir"/amplify."$merged_branch_prefix"
  rm -rf "$project_root_dir"/amplify
  git add . && git commit -m "[Post-merge autohook]: Moved env $merged_branch_prefix amplify app with commit id: $short_commit_hash to destination env folder."

  exit $?
fi

# # Ask the question
# read -p "Do you want to delete the \"$merged_branch_name\" branch? (y/N) " answer

# # Check if the answer is a single lowercase Y
# if [[ "$answer" == "y" ]]; then

#     # Delete the local branch
#     echo "Deleting local branch \"$merged_branch_name\""
#     git branch -d $merged_branch_name

#     # Delete the remote branch
#     echo "Deleting remote branch"
#     git push origin --delete $merged_branch_name
#     exit 1
# else
#     echo "Did not delete the \"$merged_branch_name\" branch"
# fi

. "$(dirname "$0")/husky.sh"
