<?php
/**
 * One-off setup script: sets the `design/footer/copyright` store config
 * value, which the PWA's Footer component now reads via
 * `storeConfig { copyright }` (see
 * pwa/overrides/@magento/venia-ui/lib/components/Footer/footer.js).
 *
 * Run from the Magento root:
 *   php scripts/set-footer-copyright.php
 *
 * Safe to re-run — updates the existing row instead of duplicating it.
 * This is just a starting placeholder; change the real text any time in
 * Admin > Content > Configuration > (edit your theme's Design Config) >
 * Footer > Copyright, no code change needed.
 */

$root = dirname(__DIR__);
$env = include $root . '/app/etc/env.php';
$db = $env['db']['connection']['default'];

$pdo = new PDO(
    "mysql:host={$db['host']};dbname={$db['dbname']};charset=utf8mb4",
    $db['username'],
    $db['password'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$path = 'design/footer/copyright';
$value = '© ' . date('Y') . ' MoonCart. All Rights Reserved.';

$existing = $pdo->prepare(
    "SELECT config_id FROM core_config_data WHERE path = ? AND scope = 'default' AND scope_id = 0"
);
$existing->execute([$path]);
$row = $existing->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $pdo->prepare('UPDATE core_config_data SET value = ? WHERE config_id = ?')
        ->execute([$value, $row['config_id']]);
    echo "Updated {$path} = \"{$value}\"\n";
} else {
    $pdo->prepare(
        "INSERT INTO core_config_data (scope, scope_id, path, value) VALUES ('default', 0, ?, ?)"
    )->execute([$path, $value]);
    echo "Created {$path} = \"{$value}\"\n";
}

echo "Done. Flush the cache (Admin > Cache Management) so the change is visible.\n";
