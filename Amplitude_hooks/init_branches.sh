#! /bin/bash
set -e

for branchName in {staging,prod,dev}; do git branch $branchName; git branch --track $branchName origin/$branchName; done
