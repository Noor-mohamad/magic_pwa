<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Helper;

use Magento\Framework\App\Helper\AbstractHelper;
use Magento\Framework\App\Helper\Context;
use Magic\MultiWishlist\Model\Wishlist;

class Data extends AbstractHelper
{
    public function __construct(Context $context)
    {
        parent::__construct($context);
    }

    /** Public share URL sent in emails and posted to social media. */
    public function getShareUrl(Wishlist $wishlist): string
    {
        return $this->_urlBuilder->getUrl('multiwishlist/index/shared', [
            'code'    => $wishlist->getSharingCode(),
            '_nosid'  => true,
        ]);
    }

    /** Facebook Open Graph sharer URL (no API key required). */
    public function getFacebookShareUrl(string $publicUrl): string
    {
        return 'https://www.facebook.com/sharer/sharer.php?u=' . urlencode($publicUrl);
    }

    /** Twitter Web Intent URL (no API key required). */
    public function getTwitterShareUrl(string $publicUrl, string $text = ''): string
    {
        $params = ['url' => $publicUrl];
        if ($text !== '') {
            $params['text'] = $text;
        }
        return 'https://twitter.com/intent/tweet?' . http_build_query($params);
    }
}
