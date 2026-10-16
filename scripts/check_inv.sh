#!/usr/bin/env bash
set -e
cd contracts
for n in 1 2 3 4 5 6 7 8 9 10 12 13 14; do
  grep -rq "INV${n}_" test || echo "MISSING INV$n"
done
