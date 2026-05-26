#!/bin/bash

# Helper function to run a command and show time taken
run_timed() {
    local label="$1"
    shift
    echo ""
    echo ">>> $label" && date
    local start=$(date +%s)
    "$@"
    local end=$(date +%s)
    echo "<<< $label completed in $((end - start)) seconds" && date
    echo "--------------------------------------"
}

overall_start=$(date +%s)
echo "======================================"
echo "Started deployment at => $(date)"
echo "======================================"

run_timed "Enabling maintenance mode"          php bin/magento maintenance:enable
run_timed "Running cache:clean"                php bin/magento cache:clean
run_timed "Running setup:upgrade"              php bin/magento setup:upgrade
run_timed "Running setup:di:compile (post)"    php bin/magento setup:di:compile
run_timed "Running setup:static-content:deploy" php bin/magento setup:static-content:deploy -f en_US
run_timed "Running cache:flush"                php bin/magento cache:flush
run_timed "Disabling maintenance mode"         php bin/magento maintenance:disable
run_timed "Setting permissions"                bash -c "chmod -R 777 var/ pub/ generated/"

overall_end=$(date +%s)
echo ""
echo "======================================"
echo "Deployment finished at => $(date)"
echo "Total deployment time => $((overall_end - overall_start)) seconds"
echo "======================================"
