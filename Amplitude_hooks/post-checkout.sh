#! /bin/bash
set -e

## Step Zero
## Checks to see if we've checked out to a newly-created branch & if we have, auto-commits an empty "first" commit
##
## Rationale: Due to the way Git maintains refs to hashes for HEAD (even when moving between branches of different names)
##            we need to first always add a default/empty commit on new branch checkout. It's also nice because it orients you.
##
## Don't believe me?

## Try this out: 1. Create an empty folder
##               2. git init
##               3. git checkout -b my_new_branch
##               4. git branch
##               5. Surprised? There is no output! That's because git isn't aware of the fact you're in a new branch
##                  as the HEAD ref isn't actually pointing at ANYTHING! :)

##            Caveat: We don't want this to happen in the case of "protected" branches:
##            ---->   staging/qa, production/prod, main/master, dev/development

## The post-merge hook runs after a successful merge command. You can use it to restore data in the working tree that
## Git can’t track, ## such as permissions data. This hook can likewise validate the presence of files external to Git
## control that you may want copied in when the working tree changes.

# Git passes these to the hook as arguments, so we use them.
from_branch_hash=$1
to_branch_hash=$2
checkout_type=$3

# These are
root_branches=("development" "dev" "staging" "qa" "production" "prod" "main" "master")
root_branches_no_main=("development" "dev" "staging" "qa" "production" "prod")

# These are useful variables for working with branches
project_root_dir=$(git rev-parse --show-toplevel)
from_branch_name=$(git reflog | awk 'NR==1{ print $6; exit }')
to_branch_name=$(git reflog | awk 'NR==1{ print $8; exit }')
from_branch_prefix=$(echo $from_branch_name | cut -d- -f1)
to_branch_prefix=$(echo $to_branch_name | cut -d- -f1)

# These are branch suffixes
# TODO: This needs to be fxed
# Currently, if there is no "-" in the string, it returns the prefix (e.g. "staging") as the suffix as well
to_branch_suffix=$(echo "$to_branch_name" | cut -d "-" -f2)
from_branch_suffix=$(echo "$from_branch_name" | cut -d "-" -f2)

# Checks to see if an array contains a string parameter
array_contains() {
  local seeking=$1
  shift
  local in=1
  for element; do
    if [[ $element == "$seeking" ]]; then
      in=0
      break
    fi
  done
  return $in
}

containsElement() {
  local e match="$1"
  shift
  for e; do [[ "$e" == "$match" ]] && return 0; done
  return 1
}

create_initial_commit() {
  git commit --allow-empty -m "Created branch $1 from $2"
}

get_branch_history() {
  local in=0

  if [[ $1 == "master" ]] || [[ $1 == "main" ]]; then
    echo "master always has history!"
    in=1
    return $in
  fi

  if [[ $(git log $1 --not $(git for-each-ref --format='%(refname)' refs/heads/ | grep -v "refs/heads/$1")) ]]; then
    return $in
  else
    in=1
    return $in
  fi
}

## No-op if you're checking into the branch you're already in!
if [[ "$from_branch_name" == "$to_branch_name" ]]; then exit; fi

# IF we're checking out to a branch (and not checking out 1 file) AND there is no branch history
if [[ $checkout_type == 1 ]] && [[ "$from_branch_hash" == "$to_branch_hash" ]] && ! gitget_branch_history "$to_branch_name"; then

  # If the new branch name matches "root" branch pattern, doesn't have history, AND doesn't have a dash in it
  # Create new branch and pass initial commit to create a new REF for this branch's HEAD
  if [[ "$to_branch_name" != *"-"* ]] && containsElement "$to_branch_name" "${root_branches[@]}"; then
    echo "Creating new ROOT BRANCH!"
    create_initial_commit "$to_branch_name" "$from_branch_name" && git push --set-upstream origin "$to_branch_name"
  fi

  # If the new branch name matches "root" branch pattern, doesn't have history, AND DOES have a dash in it
  # Create new branch and pass initial commit to create a new REF for this branch's HEAD
  if [[ "$to_branch_name" == *"-"* ]] && containsElement "$to_branch_prefix" "${root_branches[@]}"; then
    echo "Complies with naming convention!"
    create_initial_commit "$to_branch_name" "$from_branch_name" && git push --set-upstream origin "$to_branch_name"
  fi

  ## If there is no dash in the name, and there is no match to root branches and/or prefix doesn't match
  ## Delete and try again!
  if [[ "$to_branch_name" != *"-"* ]] && ! containsElement "$to_branch_name" "${root_branches[@]}" &&
    ! containsElement "$to_branch_prefix" "${root_branches[@]}"; then
    echo "[DENIED] Branch naming does not comply with repository convention!"
    echo "[ACTION] Checking you back into previous branch..."
    git checkout "$from_branch_name"
    echo "[CLEANUP] Removing invalid branch..."
    git branch -D "$to_branch_name"
    echo "[NOTICE] Please use a valid prefix-formatted branch name, and try again..."
  fi
fi

## Moving FROM an env branch to MAIN
##
if [[ "$to_branch_name" == 'master' || "$to_branch_name" == 'main' ]] && [[ -d "$project_root_dir/amplify" && "$(ls -A "$project_root_dir/amplify")" ]] && [[ "$from_branch_hash" != "$to_branch_hash" ]]; then

  echo "[PROTECTED] Folder named 'amplify' not permitted to exist in your $to_branch_name branch!"
  git mv -f "$project_root_dir"/amplify "$project_root_dir"/amplify."$from_branch_name"

  # rm -rf "$project_root_dir"/amplify."$from_branch_name" &&
  #   cp -pRP "$project_root_dir"/amplify "$project_root_dir"/amplify."$from_branch_name" &&
  #   rm -rf "$project_root_dir"/amplify
  echo "If git reports untracked files or changes, you should CHECK AND COMMIT those first!"
  exit
fi

## Moving FROM MAIN TO ENV BRANCH
if [[ "$from_branch_name" == "master" || "$from_branch_name" == "main" ]] && containsElement "$to_branch_prefix" "${root_branches_no_main[@]}" && [[ "$from_branch_hash" != "$to_branch_hash" ]]; then
  echo "[NOTICE] Checking for existing amplify env of this branch: $to_branch_prefix..."

  if [[ -e "$project_root_dir"/amplify."$to_branch_prefix" ]]; then
    ## Add check to see if there's any difference BEFORE you move with force!
    echo "[NOTICE] Found Amplify env for this branch!"
    # git mv -f "$project_root_dir"/amplify."$to_branch_prefix" "$project_root_dir"/amplify
    rm -rf "$project_root_dir"/amplify && cp -pRP "$project_root_dir"/amplify."$to_branch_prefix" "$project_root_dir"/amplify
    # cp -pRPf "$project_root_dir"/amplify."$to_branch_prefix" "$project_root_dir"/amplify
  fi

  # if [[ -e "$project_root_dir"/amplify."$to_branch_prefix" ]]; then
  #   echo "[NOTICE] Found existing, branch-specific amplify env!"
  #   cp -pRP "$project_root_dir"/amplify."$to_branch_prefix" "$project_root_dir"/amplify
  # fi
fi

. "$(dirname "$0")/husky.sh"

## Things to save and/or TODO:
## # Moves dangling amplify folder to its appropriate amplify.stage folder
## NOTE: DESTRUCTIVE! IT WILL OVERWRITE ANY EXISTING FILES!
# moveFilesWithOverwrite () {
#   local existing_amplify_folder=$1
#   local amplify_folder_destination=$2
# }

# Moves and nests dangling amplify folder to its corresponding amplify.stage folder
## NOTE: It will NEST the folder!
# moveFilesWithoutOverwriting () {
#   local existing_amplify_folder=$1
#   local amplify_folder_destination=$2
# }
