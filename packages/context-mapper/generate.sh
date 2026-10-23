#!/bin/sh
set -eu

tool="$(cd "$(dirname "$0")" && pwd)"
work="$(cd "$(dirname "$1")" && pwd)"
model="$(basename "$1")"
image=context-mapper:6.12.0

docker build --quiet --tag "$image" "$tool" >/dev/null
mkdir -p "$work/generated"

cm() {
	docker run --rm --user "$(id -u):$(id -g)" --env JAVA_OPTS=-Duser.home=/tmp --volume "$work:/work" "$image" "$@"
}

cm validate --input "$model"
cm generate --input "$model" --generator context-map --outputDir generated
