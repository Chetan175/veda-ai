#!/bin/bash
set -e

echo "Initializing MongoDB..."

mongosh <<EOF
db = db.getSiblingDB('veda_ai')
db.createCollection('assignments')
db.assignments.createIndex({ createdAt: -1 })
db.assignments.createIndex({ status: 1 })

db.createCollection('users')
db.users.createIndex({ email: 1 }, { unique: true })

db.createCollection('_prisma_migrations')

print('MongoDB initialization complete')
EOF
