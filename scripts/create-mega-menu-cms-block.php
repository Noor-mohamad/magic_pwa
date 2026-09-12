<?php
/**
 * One-off setup script: creates (or updates) the "mega_menu" CMS block
 * that the PWA's Header component now reads via the `cmsBlocks` GraphQL
 * query (see pwa/overrides/@magento/venia-ui/lib/components/Header/header.js).
 *
 * Run from the Magento root:
 *   php scripts/create-mega-menu-cms-block.php
 *
 * Safe to re-run — if the block already exists it UPDATES its content
 * instead of failing, so re-running after editing this script's HTML
 * below is fine.
 *
 * After running this, upload these 4 images in Admin > Content > Media
 * Gallery, into a "mega-menu" folder, keeping these exact filenames
 * (source files are already in the repo):
 *   - adv-1.png    <- theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/images/adv-1.png
 *   - post-1.png   <- theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/images/shop/product/small/1.png
 *   - post-2.png   <- theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/images/shop/product/small/2.png
 *   - post-3.png   <- theme/themeforest/MoonCart-v1.0-7-August-2023/xhtml/images/shop/product/small/3.png
 * They must land at pub/media/wysiwyg/mega-menu/<file>.png, matching the
 * {{media url="wysiwyg/mega-menu/..."}} directives in the content below.
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

$identifier = 'mega_menu';
$title = 'Mega Menu';

$content = <<<'HTML'
<li class="sub-menu sub-menu-down">
    <a href="#"><span>Home</span></a>
    <ul class="sub-menu">
        <li><a href="#">01 Home Page</a></li>
        <li><a href="#">02 Home Page</a></li>
        <li><a href="#">03 Home Page</a></li>
        <li><a href="#">04 Home Page</a></li>
    </ul>
</li>
<li class="has-mega-menu sub-menu-down">
    <a href="#"><span>Shop</span></a>
    <div class="mega-menu shop-menu">
        <div class="row">
            <div class="col-lg-12 col-md-12 col-sm-12">
                <div class="row">
                    <div class="col-md-4 col-sm-6 col-6">
                        <a href="#" class="menu-title">Shop Structure</a>
                        <ul>
                            <li><a href="#">Shop Standard</a></li>
                            <li><a href="#">Shop List</a></li>
                            <li><a href="#">Shop With Category</a></li>
                            <li><a href="#">Shop Filters Top Bar</a></li>
                            <li><a href="#">Shop Sidebar</a></li>
                            <li><a href="#">Shop Style 1</a></li>
                        </ul>
                        <a href="#" class="menu-title">Product Structure</a>
                        <ul>
                            <li><a href="#">Default</a></li>
                            <li><a href="#">Thumbnail</a></li>
                        </ul>
                    </div>
                    <div class="col-md-3 col-sm-6 col-12">
                        <a href="#" class="menu-title">Shop Pages</a>
                        <ul>
                            <li><a href="#">Wishlist</a></li>
                            <li><a href="#">Cart</a></li>
                            <li><a href="#">Checkout</a></li>
                            <li><a href="#">Order Tracking</a></li>
                            <li><a href="#">My Account</a></li>
                            <li><a href="#">Registration</a></li>
                        </ul>
                    </div>
                    <div class="col-md-5 col-sm-4 col-6 d-none d-md-block">
                        <div class="adv-media">
                            <img src="{{media url="wysiwyg/mega-menu/adv-1.png"}}" alt="/">
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <div class="month-deal">
                            <div>
                                <h3>Deal of the month</h3>
                                <p class="mb-0">Yes! Send me exclusive offers, personalised, and unique gift ideas, tips for shopping on MoonCart <a href="#" class="dz-link-2">View All Products</a></p>
                            </div>
                            <div class="sale-countdown">
                                <div class="countdown text-center">
                                    <div class="date"><span class="time days text-primary">02</span><span class="work-time">Days</span></div>
                                    <div class="date"><span class="time hours text-primary">18</span><span class="work-time">Hours</span></div>
                                    <div class="date"><span class="time mins text-primary">45</span><span class="work-time">Minutess</span></div>
                                    <div class="date"><span class="time secs text-primary">36</span><span class="work-time">Second</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</li>
<li class="has-mega-menu sub-menu-down">
    <a href="#"><span>Blog</span></a>
    <div class="mega-menu blog-menu">
        <div class="row">
            <div class="col-md-6 col-sm-6 col-6">
                <a href="#" class="menu-title">Blog Dark Style</a>
                <ul>
                    <li><a href="#">Blog 2 Column</a></li>
                    <li><a href="#">Blog 2 Column Sidebar</a></li>
                    <li><a href="#">Blog 3 Column</a></li>
                    <li><a href="#">Blog Half Image</a></li>
                </ul>
                <a href="#" class="menu-title">Blog Light Style</a>
                <ul>
                    <li><a href="#">Blog 2 Column</a></li>
                    <li><a href="#">Blog 2 Column Sidebar</a></li>
                    <li><a href="#">Blog 3 Column</a></li>
                    <li><a href="#">Blog Half Image</a></li>
                </ul>
                <a href="#" class="menu-title">Blog Details</a>
                <ul>
                    <li><a href="#">Post Standard</a></li>
                    <li><a href="#">Post Header Image</a></li>
                </ul>
            </div>
            <div class="col-md-6 col-sm-6 col-12">
                <a href="#" class="menu-title">Recent Posts</a>
                <div class="widget widget_post pt-2">
                    <ul>
                        <li>
                            <div class="dz-media"><img src="{{media url="wysiwyg/mega-menu/post-1.png"}}" alt=""></div>
                            <div class="dz-content"><h6 class="name"><a href="#">Wooden Water Bottles</a></h6><span class="time">July 23, 2023</span></div>
                        </li>
                        <li>
                            <div class="dz-media"><img src="{{media url="wysiwyg/mega-menu/post-2.png"}}" alt=""></div>
                            <div class="dz-content"><h6 class="name"><a href="#">Eco friendly bags</a></h6><span class="time">July 23, 2023</span></div>
                        </li>
                        <li>
                            <div class="dz-media"><img src="{{media url="wysiwyg/mega-menu/post-3.png"}}" alt=""></div>
                            <div class="dz-content"><h6 class="name"><a href="#">Bamboo toothbrushes</a></h6><span class="time">July 23, 2023</span></div>
                        </li>
                        <li>
                            <div class="dz-media"><img src="{{media url="wysiwyg/mega-menu/post-2.png"}}" alt=""></div>
                            <div class="dz-content"><h6 class="name"><a href="#">Eco friendly bags</a></h6><span class="time">July 23, 2023</span></div>
                        </li>
                        <li>
                            <div class="dz-media"><img src="{{media url="wysiwyg/mega-menu/post-1.png"}}" alt=""></div>
                            <div class="dz-content"><h6 class="name"><a href="#">Wooden Water Bottles</a></h6><span class="time">July 23, 2023</span></div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</li>
<li class="sub-menu sub-menu-down">
    <a href="#"><span>Pages</span></a>
    <ul class="sub-menu">
        <li><a href="#">About Us</a></li>
        <li><a href="#">About Me</a></li>
        <li><a href="#">Pricing Table</a></li>
        <li><a href="#">Our Gift Vouchers</a></li>
        <li><a href="#">What We Do</a></li>
        <li><a href="#">Faqs</a></li>
        <li><a href="#">Our Team</a></li>
        <li><a href="#">Contact Us</a></li>
        <li><a href="#">Error 404</a></li>
        <li><a href="#">Under Construction</a></li>
        <li><a href="#">Coming Soon</a></li>
    </ul>
</li>
<li><a href="#">Contact Us</a></li>
HTML;

$existing = $pdo->prepare('SELECT block_id FROM cms_block WHERE identifier = ?');
$existing->execute([$identifier]);
$row = $existing->fetch(PDO::FETCH_ASSOC);

if ($row) {
    $blockId = (int) $row['block_id'];
    $update = $pdo->prepare('UPDATE cms_block SET title = ?, content = ?, is_active = 1, update_time = NOW() WHERE block_id = ?');
    $update->execute([$title, $content, $blockId]);
    echo "Updated existing cms_block id={$blockId}, identifier={$identifier}\n";
} else {
    $insert = $pdo->prepare('INSERT INTO cms_block (title, identifier, content, is_active, creation_time, update_time) VALUES (?, ?, ?, 1, NOW(), NOW())');
    $insert->execute([$title, $identifier, $content]);
    $blockId = (int) $pdo->lastInsertId();

    // store_id = 0 means "All Store Views", matching how the project's
    // other CMS blocks (footer_links_block, etc.) are assigned.
    $pdo->prepare('INSERT INTO cms_block_store (block_id, store_id) VALUES (?, 0)')->execute([$blockId]);
    echo "Created cms_block id={$blockId}, identifier={$identifier}\n";
}

echo 'Content length: ' . strlen($content) . " bytes\n";
echo "Done. Flush the cache (Admin > Cache Management, or System > Cache Management) so the change is visible.\n";
