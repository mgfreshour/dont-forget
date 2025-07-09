#!/bin/bash
node dist/test-setup.js
node --test --experimental-test-coverage dist/tools/*.test.js
