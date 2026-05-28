#!/bin/sh
set -e

./migrate up

exec ./main
