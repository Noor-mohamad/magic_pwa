<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Block\Wishlist;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magic\MultiWishlist\Helper\Data as WishlistHelper;
use Magic\MultiWishlist\Model\Wishlist as WishlistModel;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist as WishlistResource;
use Magic\MultiWishlist\Model\WishlistFactory;

class Share extends Template
{
    protected $_template = 'Magic_MultiWishlist::wishlist/share.phtml';

    private ?WishlistModel $wishlist = null;

    public function __construct(
        Context $context,
        private readonly CustomerSession $customerSession,
        private readonly WishlistFactory $wishlistFactory,
        private readonly WishlistResource $wishlistResource,
        private readonly WishlistHelper $helper,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getWishlist(): ?WishlistModel
    {
        if ($this->wishlist === null) {
            $wishlistId = (int) $this->getRequest()->getParam('wishlist_id');
            $wishlist   = $this->wishlistFactory->create();
            $this->wishlistResource->load($wishlist, $wishlistId);
            if ($wishlist->getId() && $wishlist->getCustomerId() === (int) $this->customerSession->getCustomerId()) {
                $this->wishlist = $wishlist;
            }
        }
        return $this->wishlist;
    }

    public function getPublicShareUrl(): string
    {
        $wishlist = $this->getWishlist();
        return $wishlist ? $this->helper->getShareUrl($wishlist) : '';
    }

    public function getFacebookShareUrl(): string
    {
        return $this->helper->getFacebookShareUrl($this->getPublicShareUrl());
    }

    public function getTwitterShareUrl(): string
    {
        $wishlist = $this->getWishlist();
        $text     = $wishlist ? (string) __('Check out my wishlist: %1', $wishlist->getWishlistName()) : '';
        return $this->helper->getTwitterShareUrl($this->getPublicShareUrl(), $text);
    }

    public function getShareFormAction(): string
    {
        $wishlist = $this->getWishlist();
        return $this->getUrl('multiwishlist/index/share', [
            'wishlist_id' => $wishlist ? $wishlist->getId() : 0,
        ]);
    }

    public function getBackUrl(): string
    {
        $wishlist = $this->getWishlist();
        return $this->getUrl('multiwishlist/index/view', [
            'wishlist_id' => $wishlist ? $wishlist->getId() : 0,
        ]);
    }
}
