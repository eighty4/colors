#!/bin/zsh
set -e

pushd "$1"
rm "$1.zip"
zip -qr "$1.zip" .
popd

aws lambda update-function-code --function-name "$2" --zip-file "fileb://$1/$1.zip"
