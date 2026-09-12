<?php
/**
 * One-off setup script: creates (or updates) the three CMS blocks the
 * PWA's Footer component reads via the `cmsBlocks` GraphQL query (see
 * pwa/overrides/@magento/venia-ui/lib/components/Footer/footer.js):
 *
 *   - footer_instagram : the "share with #MoonCart" image grid + follow tile
 *   - footer_menu       : the 3 link columns (Our Stores / Useful Links / Footer Menu)
 *   - footer_social     : the Facebook/Twitter/LinkedIn/Instagram icon links
 *
 * Run from the Magento root:
 *   php scripts/create-footer-cms-blocks.php
 *
 * Safe to re-run — existing blocks get UPDATEd, not duplicated.
 *
 * footer_instagram's images are already copied to
 * pub/media/wysiwyg/footer/{pic1,pic2,pic3,pic4,insta-follow}.png
 * (matching the {{media url="wysiwyg/footer/..."}} directives below) —
 * nothing to upload for this one.
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

$blocks = [];

$blocks['footer_instagram'] = [
    'title' => 'Footer Instagram',
    'content' => <<<'HTML'
<div class="col-lg-6 col-6">
    <div class="dz-post-media">
        <img src="{{media url="wysiwyg/footer/pic1.png"}}" alt="">
    </div>
</div>
<div class="col-lg-6 col-6">
    <div class="dz-post-media">
        <img src="{{media url="wysiwyg/footer/pic2.png"}}" alt="">
    </div>
</div>
<div class="col-lg-6  col-6">
    <div class="dz-post-media">
        <img src="{{media url="wysiwyg/footer/pic3.png"}}" alt="">
    </div>
</div>
<div class="col-lg-6 col-6">
    <div class="dz-post-media">
        <img src="{{media url="wysiwyg/footer/pic4.png"}}" alt="">
    </div>
</div>
<a href="#" class="instagram-link">
    <div class="follow-link bg-white">
        <div class="follow-link-icon">
            <img src="{{media url="wysiwyg/footer/insta-follow.png"}}" alt="">
        </div>
        <div class="follow-link-content">
            <h4>Share with #MoonCart</h4>
            <p>Follow @MoonCart for inspiration.</p>
        </div>
    </div>
</a>
HTML
];

$blocks['footer_menu'] = [
    'title' => 'Footer Menu Columns',
    'content' => <<<'HTML'
<div class="col-lg-4 col-md-4 col-sm-4 col-6">
    <div class="widget widget_services">
        <h5 class="footer-title">Our Stores</h5>
        <ul>
            <li><a href="#">New York</a></li>
            <li><a href="#">London SF</a></li>
            <li><a href="#">Edinburgh</a></li>
            <li><a href="#">Los Angeles</a></li>
            <li><a href="#">Chicago</a></li>
            <li><a href="#">Las Vegas</a></li>
        </ul>
    </div>
</div>
<div class="col-lg-4 col-md-4 col-sm-4 col-6">
    <div class="widget widget_services">
        <h5 class="footer-title">Useful Links</h5>
        <ul>
            <li><a href="{{store url="privacy-policy-cookie-restriction-mode"}}">Privacy Policy</a></li>
            <li><a href="#">Returns</a></li>
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="{{store url="customer-service"}}">Contact Us</a></li>
            <li><a href="#">Latest News</a></li>
            <li><a href="#">Our Sitemap</a></li>
        </ul>
    </div>
</div>
<div class="col-lg-4 col-md-4 col-sm-4 col-12">
    <div class="widget widget_services">
        <h5 class="footer-title">Footer Menu</h5>
        <ul>
            <li><a href="#">Instagram profile</a></li>
            <li><a href="#">New Collection</a></li>
            <li><a href="#">Woman Dress</a></li>
            <li><a href="{{store url="customer-service"}}">Contact Us</a></li>
            <li><a href="#">Latest News</a></li>
        </ul>
    </div>
</div>
HTML
];

$blocks['footer_social'] = [
    'title' => 'Footer Social Links',
    'content' => <<<'HTML'
<ul>
    <li><a href="#" target="_blank" rel="noreferrer"><i class="fa-brands fa-facebook-f"></i></a></li>
    <li><a href="#" target="_blank" rel="noreferrer"><i class="fa-brands fa-twitter"></i></a></li>
    <li><a href="#" target="_blank" rel="noreferrer"><i class="fa-brands fa-linkedin"></i></a></li>
    <li><a href="#" target="_blank" rel="noreferrer"><i class="fa-brands fa-instagram"></i></a></li>
</ul>
HTML
];

foreach ($blocks as $identifier => $block) {
    $existing = $pdo->prepare('SELECT block_id FROM cms_block WHERE identifier = ?');
    $existing->execute([$identifier]);
    $row = $existing->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $blockId = (int) $row['block_id'];
        $update = $pdo->prepare('UPDATE cms_block SET title = ?, content = ?, is_active = 1, update_time = NOW() WHERE block_id = ?');
        $update->execute([$block['title'], $block['content'], $blockId]);
        echo "Updated existing cms_block id={$blockId}, identifier={$identifier}\n";
    } else {
        $insert = $pdo->prepare('INSERT INTO cms_block (title, identifier, content, is_active, creation_time, update_time) VALUES (?, ?, ?, 1, NOW(), NOW())');
        $insert->execute([$block['title'], $identifier, $block['content']]);
        $blockId = (int) $pdo->lastInsertId();

        // store_id = 0 means "All Store Views", matching the project's
        // other CMS blocks.
        $pdo->prepare('INSERT INTO cms_block_store (block_id, store_id) VALUES (?, 0)')->execute([$blockId]);
        echo "Created cms_block id={$blockId}, identifier={$identifier}\n";
    }
}

echo "Done. Flush the cache (Admin > Cache Management) so the change is visible.\n";
