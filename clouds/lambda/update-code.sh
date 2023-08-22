#!/bin/zsh
set -e

pushd "$1"
rm -f "$1.zip"
zip -qr "$1.zip" .
popd

aws lambda list-functions --output text --query "Functions[].[join(': ',[FunctionName,CodeSha256])]"

aws lambda get-function --function-name "$2" --output text --query "Configuration.CodeSha256"

#aws lambda update-function-code --function-name "$2" --zip-file "fileb://$1/$1.zip"

#openssl dgst -sha256 -binary github-oauth-redirect/github-oauth-redirect.zip | openssl enc -base64
