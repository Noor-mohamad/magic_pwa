<?php
declare(strict_types=1);

namespace Magic\MultiWishlist\Block\Wishlist;

use Magento\Customer\Model\Session as CustomerSession;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\Collection as WishlistCollection;
use Magic\MultiWishlist\Model\ResourceModel\Wishlist\CollectionFactory as WishlistCollectionFactory;
use Magic\MultiWishlist\Model\ResourceModel\WishlistItem\CollectionFactory as ItemCollectionFactory;

class Index extends Template
{
    protected $_template = 'Magic_MultiWishlist::wishlist/index.phtml';

    public function __construct(
        Context $context,
        private readonly CustomerSession $customerSession,
        private readonly WishlistCollectionFactory $wishlistCollectionFactory,
        private readonly ItemCollectionFactory $itemCollectionFactory,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    public function getWishlists(): WishlistCollection
    {
        return $this->wishlistCollectionFactory->create()
            ->addFieldToFilter('customer_id', $this->customerSession->getCustomerId())
            ->setOrder('is_default', 'DESC')
            ->setOrder('created_at', 'ASC');
    }

    public function getItemCount(int $wishlistId): int
    {
        return $this->itemCollectionFactory->create()
            ->addFieldToFilter('wishlist_id', $wishlistId)
            ->getSize();
    }

    public function getCreateUrl(): string
    {
        return $this->getUrl('multiwishlist/index/create');
    }

    public function getViewUrl(int $wishlistId): string
    {
        return $this->getUrl('multiwishlist/index/view', ['wishlist_id' => $wishlistId]);
    }

    public function getDeleteUrl(int $wishlistId): string
    {
        return $this->getUrl('multiwishlist/index/delete', ['wishlist_id' => $wishlistId]);
    }
}
